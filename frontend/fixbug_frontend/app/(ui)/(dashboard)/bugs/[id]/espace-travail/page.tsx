"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import Editor, { DiffEditor } from "@monaco-editor/react";
import "xterm/css/xterm.css";
import {
  Send, Loader2, Code2, Eye, CheckCircle2, XCircle,
  Bot, ExternalLink, TerminalSquare, Sparkles, PanelLeftClose, AlertCircle, ChevronDown,
  GitBranch, GitPullRequest, ArrowLeft, RefreshCw,FilePlus,FolderPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { apiFetch } from "@/lib/api";
import { construireArborescenceWebContainer } from "@/lib/construire-arborescence";
import { FileTree } from "../../../../../components/file-tree";
import { filtrerFichiersPourIA } from "@/lib/fitrer-fichiers-ia";
import { toast } from "sonner";

let webcontainerInstancePromise: Promise<WebContainer> | null = null;
function getWebContainerInstance() {
  if (!webcontainerInstancePromise) webcontainerInstancePromise = WebContainer.boot();
  return webcontainerInstancePromise;
}

type FichierRecu = { chemin: string; contenu: string };
type Proposition = { cheminFichier: string; nouveauContenu: string; explication: string };
type StatutMessage = "en_cours" | "succes" | "echec";
type MessageChat = { role: "user" | "assistant"; contenu: string; statut?: StatutMessage };
type ResultatPR = { url: string; numeroPR: number } | null;

type EtatModification = {
  cheminFichier: string;
  contenuOriginal: string;
  contenuPropose: string;
  explication: string;
  statut: "en_attente" | "accepte" | "rejete";
};

type CacheWorkspace = {
  fichiers: Record<string, string>;
  modifications: EtatModification[];
  branchePoussee: string | null;
};

const DOSSIERS_EXCLUS_DU_PUSH = ["node_modules/", ".git/", ".next/", "dist/", "build/"];
const EXTENSIONS_BINAIRES_EXCLUES_DU_PUSH = [".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".eot", ".pdf", ".mp4", ".mp3", ".zip"];

function filtrerFichiersPourPush(fichiers: Record<string, string>): { chemin: string; contenu: string }[] {
  return Object.entries(fichiers)
    .filter(([chemin]) => !DOSSIERS_EXCLUS_DU_PUSH.some((d) => chemin.includes(d)))
    .filter(([chemin]) => !EXTENSIONS_BINAIRES_EXCLUES_DU_PUSH.some((ext) => chemin.toLowerCase().endsWith(ext)))
    .map(([chemin, contenu]) => ({ chemin, contenu }));
}

export default function EspaceTravailPage() {
  const params = useParams();
  const bugId = params.id;
  const cleCache = `fixbug-workspace-${bugId}`;

  const [statutEnv, setStatutEnv] = useState("Récupération des fichiers...");
  const [envPret, setEnvPret] = useState(false);
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [fichiers, setFichiers] = useState<Record<string, string>>({});
  const [fichierActif, setFichierActif] = useState<string | null>(null);
  const [vue, setVue] = useState<"code" | "preview">("code");
  const instanceRef = useRef<WebContainer | null>(null);
  const processusActifRef = useRef<any>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const dejaLance = useRef(false);
  const [bug, setBug] = useState<{ titre: string | null; description: string; captures: string[] } | null>(null);
  const [detailsBugOuverts, setDetailsBugOuverts] = useState(true);
  const contenuOriginalRef = useRef<Record<string, string>>({});

  const [chatOuvert, setChatOuvert] = useState(false);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [saisie, setSaisie] = useState("");
  const [enReflexion, setEnReflexion] = useState(false);
  const [modifications, setModifications] = useState<EtatModification[]>([]);

  // etat iframe
  const [previewVersion, setPreviewVersion] = useState(0);
  const rafraichissementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [branchePoussee, setBranchePoussee] = useState<string | null>(null);
  const [pushEnCours, setPushEnCours] = useState(false);
  const [prEnCours, setPrEnCours] = useState(false);
  const [resultatPR, setResultatPR] = useState<ResultatPR>(null);
  const finChatRef = useRef<HTMLDivElement>(null);

  // creer dossier et fichier

  const [creationOuverte, setCreationOuverte] = useState<"fichier" | "dossier" | null>(null);
  const [nomCreation, setNomCreation] = useState("");
  const creationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creationOuverte) creationInputRef.current?.focus();
  }, [creationOuverte]);

  async function confirmerCreation() {
    const chemin = nomCreation.trim().replace(/^\/+/, "");
    if (!chemin) { setCreationOuverte(null); return; }

    if (creationOuverte === "dossier") {
      try {
        await instanceRef.current?.fs.mkdir(chemin, { recursive: true });
        toast.success(`Dossier créé : ${chemin}`);
      } catch {
        toast.error("Impossible de créer ce dossier");
      }
      setCreationOuverte(null);
      setNomCreation("");
      return;
    }

    // Fichier — crée aussi les dossiers parents manquants si le chemin en contient
    // (ex: "src/components/Nouveau.tsx" crée src/components/ s'il n'existe pas)
    if (fichiers[chemin]) {
      toast.error("Ce fichier existe déjà");
      return;
    }
    const dossierParent = chemin.includes("/") ? chemin.slice(0, chemin.lastIndexOf("/")) : null;
    try {
      if (dossierParent) await instanceRef.current?.fs.mkdir(dossierParent, { recursive: true });
      await instanceRef.current?.fs.writeFile(chemin, "");
    } catch { }

    setFichiers((prev) => ({ ...prev, [chemin]: "" }));
    setModifications((prev) => [...prev, {
      cheminFichier: chemin, contenuOriginal: "", contenuPropose: "",
      explication: "Nouveau fichier créé par le développeur", statut: "accepte",
    }]);
    setFichierActif(chemin);
    setCreationOuverte(null);
    setNomCreation("");
    declencherRafraichissementPreview(true);
  }


  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, enReflexion]);

  useEffect(() => {
    if (Object.keys(fichiers).length === 0) return;
    try {
      const cache: CacheWorkspace = { fichiers, modifications, branchePoussee };
      localStorage.setItem(cleCache, JSON.stringify(cache));
    } catch { }
  }, [fichiers, modifications, branchePoussee, cleCache]);

  function declencherRafraichissementPreview(immediat = false) {
    if (rafraichissementTimeoutRef.current) clearTimeout(rafraichissementTimeoutRef.current);
    if (immediat) {
      setPreviewVersion((v) => v + 1);
      return;
    }
    rafraichissementTimeoutRef.current = setTimeout(() => setPreviewVersion((v) => v + 1), 1200);
  }

  function creerNouveauFichier() {
    const chemin = prompt("Chemin du nouveau fichier (ex: src/components/NouveauComposant.tsx) :");
    if (!chemin || fichiers[chemin]) return;

    setFichiers((prev) => ({ ...prev, [chemin]: "" }));
    setModifications((prev) => [...prev, {
      cheminFichier: chemin, contenuOriginal: "", contenuPropose: "",
      explication: "Nouveau fichier créé par le développeur", statut: "accepte",
    }]);
    setFichierActif(chemin);
    instanceRef.current?.fs.writeFile(chemin, "").catch(() => { });
  }

  async function demarrerServeurStatique(instance: WebContainer, terminal: Terminal) {
    setStatutEnv("Démarrage de live-server...");
    const serveur = await instance.spawn("npx", ["--yes", "live-server", "--port=3111", "--no-browser", "--host=0.0.0.0"]);
    processusActifRef.current = serveur;
    serveur.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));
  }

  useEffect(() => {
    if (dejaLance.current) return;
    dejaLance.current = true;

    const terminal = new Terminal({
      convertEol: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      theme: { background: "#0B0D14", foreground: "#E2E8F0", cursor: "#10B981" },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      fitAddon.fit();
      const observer = new ResizeObserver(() => { try { fitAddon.fit(); } catch { } });
      observer.observe(terminalRef.current);
    }

    terminal.onData((data) => {
      const processus = processusActifRef.current;
      if (processus) {
        const writer = processus.input.getWriter();
        writer.write(data);
        writer.releaseLock();
      }
    });

    async function demarrer() {
      apiFetch(`/bugs/${bugId}`).then((data) => {
        setBug(data);
        if (data.branchePoussee && !branchePoussee) setBranchePoussee(data.branchePoussee);
        if (data.urlPR) setResultatPR({ url: data.urlPR, numeroPR: data.numeroPR });

        const historique = (data.messagesDeveloppeur as any[]) ?? [];
        const messagesReconstruits: MessageChat[] = historique.map((m) => ({
          role: m.role, contenu: m.contenu, statut: m.role === "assistant" ? "succes" : undefined,
        }));
        if (messagesReconstruits.length > 0) setMessages(messagesReconstruits);
      }).catch(() => setBug(null));

      const cacheBrut = localStorage.getItem(cleCache);
      let recus: FichierRecu[];

      if (cacheBrut) {
        try {
          const cache: CacheWorkspace = JSON.parse(cacheBrut);
          recus = Object.entries(cache.fichiers).map(([chemin, contenu]) => ({ chemin, contenu }));
          setModifications(cache.modifications ?? []);
          if (cache.branchePoussee) setBranchePoussee(cache.branchePoussee);
          setStatutEnv(`${recus.length} fichiers restaurés depuis le cache local...`);
        } catch {
          recus = await apiFetch(`/bugs/${bugId}/fichiers`);
          setStatutEnv(`${recus.length} fichiers récupérés depuis GitHub — montage...`);
        }
      } else {
        recus = await apiFetch(`/bugs/${bugId}/fichiers`);
        setStatutEnv(`${recus.length} fichiers récupérés depuis GitHub — montage...`);
      }

      const carte = Object.fromEntries(recus.map((f) => [f.chemin, f.contenu]));
      setFichiers(carte);
      contenuOriginalRef.current = { ...carte };
      setFichierActif(recus[0]?.chemin ?? null);

      const arborescence = construireArborescenceWebContainer(recus);
      const instance = await getWebContainerInstance();
      instanceRef.current = instance;
      await instance.mount(arborescence);

      const aUnPackageJson = recus.some((f) => f.chemin === "package.json");
      let commandeTrouvee: string[] | null = null;

      if (aUnPackageJson) {
        setStatutEnv("Installation des dépendances...");
        const install = await instance.spawn("npm", ["install"]);
        processusActifRef.current = install;
        install.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));
        await install.exit;
        commandeTrouvee = detecterCommandeDemarrage(recus);
      }

      if (commandeTrouvee) {
        setStatutEnv(`Démarrage (${commandeTrouvee.join(" ")})...`);
        const dev = await instance.spawn(commandeTrouvee[0], commandeTrouvee.slice(1));
        processusActifRef.current = dev;
        dev.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));
      } else {
        await demarrerServeurStatique(instance, terminal);
      }

      instance.on("server-ready", (_port, url) => {
        setStatutEnv("Environnement prêt");
        setEnvPret(true);
        setUrlPreview(url);
      });

      setMessages((prev) =>
        prev.length > 0 ? prev : [{
          role: "assistant",
          contenu: "Environnement prêt. Décrivez-moi ce que vous voulez corriger — je vais explorer le code et proposer une correction.",
          statut: "succes",
        }],
      );
    }

    demarrer().catch((err) => setStatutEnv("Erreur : " + err.message));
  }, [bugId]);

  async function envoyerMessage() {
    if (!saisie.trim() || enReflexion) return;
    const contenu = saisie;
    setSaisie("");
    setEnReflexion(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", contenu },
      { role: "assistant", contenu: "J'explore le code du projet pour comprendre la demande...", statut: "en_cours" },
    ]);

    try {
      const { fichiersFiltres } = filtrerFichiersPourIA(fichiers);
      const resultat = await apiFetch(`/bugs/${bugId}/demander-analyse`, {
        method: "PATCH",
        body: JSON.stringify({ instructionDeveloppeur: contenu, fichiers: fichiersFiltres }),
        headers: { "Content-Type": "application/json" },
      });
      const { resumeIA, propositions: nouvelles } = JSON.parse(resultat.proposition);

      setMessages((prev) => {
        const copie = [...prev];
        copie[copie.length - 1] = { role: "assistant", contenu: resumeIA, statut: nouvelles.length > 0 ? "succes" : "echec" };
        return copie;
      });

      if (nouvelles.length > 0) {
        setModifications((prev) => {
          const copie = [...prev];
          nouvelles.forEach((p: Proposition) => {
            const indexExistant = copie.findIndex((m) => m.cheminFichier === p.cheminFichier);
            const nouvelleEntree: EtatModification = {
              cheminFichier: p.cheminFichier,
              contenuOriginal: fichiers[p.cheminFichier] ?? "",
              contenuPropose: p.nouveauContenu,
              explication: p.explication,
              statut: "en_attente",
            };
            if (indexExistant >= 0) copie[indexExistant] = nouvelleEntree; else copie.push(nouvelleEntree);
          });
          return copie;
        });

        setFichierActif(nouvelles[0].cheminFichier);
        setVue("code");
      }
    } catch (err) {
      setMessages((prev) => {
        const copie = [...prev];
        copie[copie.length - 1] = { role: "assistant", contenu: "Je n'ai pas pu traiter cette demande : " + (err instanceof Error ? err.message : "erreur inconnue"), statut: "echec" };
        return copie;
      });
    } finally {
      setEnReflexion(false);
    }
  }

  function detecterCommandeDemarrage(fichiers: FichierRecu[]): string[] | null {
    const packageJson = fichiers.find((f) => f.chemin === "package.json");
    if (!packageJson) return null;
    try {
      const scripts = JSON.parse(packageJson.contenu).scripts || {};
      for (const nom of ["dev", "start", "serve"]) if (scripts[nom]) return ["npm", "run", nom];
    } catch { }
    return null;
  }

  function handleEditionManuelle(nouveauContenu: string | undefined) {
    if (!fichierActif || nouveauContenu === undefined) return;
    setFichiers((prev) => ({ ...prev, [fichierActif]: nouveauContenu }));

    setModifications((prev) => {
      const existe = prev.some((m) => m.cheminFichier === fichierActif);
      if (existe) {
        return prev.map((m) =>
          m.cheminFichier === fichierActif ? { ...m, contenuPropose: nouveauContenu } : m,
        );
      }
      const nouvelleEntree: EtatModification = {
        cheminFichier: fichierActif,
        contenuOriginal: contenuOriginalRef.current[fichierActif] ?? "",
        contenuPropose: nouveauContenu,
        explication: "Modifié manuellement par le développeur",
        statut: "accepte",
      };
      return [...prev, nouvelleEntree];
    });

    instanceRef.current?.fs.writeFile(fichierActif, nouveauContenu).catch(() => { });
    declencherRafraichissementPreview();
  }

  function accepterModification(chemin: string) {
    const mod = modifications.find((m) => m.cheminFichier === chemin);
    if (!mod) return;
    setFichiers((prev) => ({ ...prev, [chemin]: mod.contenuPropose }));
    instanceRef.current?.fs.writeFile(chemin, mod.contenuPropose).catch(() => { });
    setModifications((prev) => prev.map((m) => (m.cheminFichier === chemin ? { ...m, statut: "accepte" } : m)));
    toast.success(`Modification acceptée : ${chemin}`);
    declencherRafraichissementPreview(true);
  }

  function rejeterModification(chemin: string) {
    const mod = modifications.find((m) => m.cheminFichier === chemin);
    if (!mod) return;
    setModifications((prev) => prev.map((m) => (m.cheminFichier === chemin ? { ...m, statut: "rejete" } : m)));
    toast.info(`Modification rejetée : ${chemin}`);
  }

  async function pousserSurGithub() {
    const nombreAcceptees = modifications.filter((m) => m.statut === "accepte").length;
    if (nombreAcceptees === 0) {
      toast.error("Acceptez au moins une modification (ou éditez/créez un fichier) avant de pousser sur GitHub.");
      return;
    }
    setPushEnCours(true);
    try {
      const fichiersAPousser = filtrerFichiersPourPush(fichiers);
      const resultat = await apiFetch(`/bugs/${bugId}/pousser-github`, {
        method: "POST",
        body: JSON.stringify({ fichiers: fichiersAPousser }),
        headers: { "Content-Type": "application/json" },
      });
      setBranchePoussee(resultat.branchePoussee);
      toast.success(`Code poussé sur la branche ${resultat.branchePoussee} (${fichiersAPousser.length} fichiers)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du push sur GitHub");
    } finally {
      setPushEnCours(false);
    }
  }


  async function creerPullRequest() {
    if (!branchePoussee) {
      toast.error("Poussez d'abord vos modifications sur GitHub.");
      return;
    }
    setPrEnCours(true);
    try {
      const resultat = await apiFetch(`/bugs/${bugId}/creer-pull-request`, { method: "POST" });
      setResultatPR({ url: resultat.urlPR, numeroPR: resultat.numeroPR });
      toast.success(resultatPR ? `Pull Request #${resultat.numeroPR} mise à jour` : `Pull Request #${resultat.numeroPR} créée`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création de la Pull Request");
    } finally {
      setPrEnCours(false);
    }
  }

  const nomsFichiers = Object.keys(fichiers);
  const nombreModificationsAcceptees = modifications.filter((m) => m.statut === "accepte").length;
  const modificationDuFichierActif = fichierActif ? modifications.find((m) => m.cheminFichier === fichierActif) : undefined;
  // MODIFIÉ : plus de toggle manuel — le diff s'affiche automatiquement tant que
  // la proposition n'a pas été acceptée/rejetée.
  const afficherEnDiff = !!modificationDuFichierActif && modificationDuFichierActif.statut === "en_attente";

  return (
    <div className="relative flex h-[calc(100vh-64px)] -m-6 flex-col gap-0 overflow-hidden bg-slate-50/30">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-2.5 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <Link href="/bugs" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <span className="h-4 w-px bg-slate-200" />
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12151F]">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#12151F]">Espace de travail</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${envPret ? "bg-emerald-500" : "animate-pulse bg-amber-400"}`} />
              {statutEnv}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {resultatPR && (
            <a href={resultatPR.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" /> PR #{resultatPR.numeroPR} <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <Button
            onClick={pousserSurGithub}
            disabled={pushEnCours || nombreModificationsAcceptees === 0}
            size="sm"
            variant={branchePoussee ? "outline" : "default"}
            title={nombreModificationsAcceptees === 0 ? "Acceptez ou éditez au moins un fichier" : undefined}
            className={`gap-1.5 text-xs sm:text-sm ${branchePoussee ? "" : "bg-[#12151F] hover:bg-[#12151F]/90"}`}
          >
            {pushEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
            {branchePoussee ? "Repousser sur GitHub" : "Pousser sur GitHub"}
          </Button>

          {/* MODIFIÉ : ce bouton reste désormais toujours visible dès qu'une branche
              a été poussée, même après une première PR créée — cliquer à nouveau
              après un nouveau push met simplement à jour les infos de la PR. */}
          <Button
            onClick={creerPullRequest}
            disabled={prEnCours || !branchePoussee}
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
            title={!branchePoussee ? "Poussez d'abord vos modifications sur GitHub" : undefined}
          >
            {prEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitPullRequest className="h-3.5 w-3.5" />}
            {resultatPR ? "Mettre à jour la Pull Request" : "Créer la Pull Request"}
          </Button>
        </div>
      </div>

      {branchePoussee && !resultatPR && (
        <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          <GitBranch className="h-3 w-3" /> Code poussé sur <code className="font-mono">{branchePoussee}</code> — vous pouvez maintenant créer la Pull Request.
        </div>
      )}

      <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {chatOuvert && (
          <>
            <ResizablePanel defaultSize={300} minSize={260} maxSize={420} id="panel-chat">
              <div className="flex h-full flex-col bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 bg-[#12151F] px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white leading-none">Assistant FixBug</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setChatOuvert(false)} title="Masquer le chat" className="h-7 w-7 text-white/60 hover:bg-white/10 hover:text-white">
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-slate-50/40">
                  {bug && (
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <button onClick={() => setDetailsBugOuverts((v) => !v)} className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
                        <span className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Détails du bug signalé</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${detailsBugOuverts ? "rotate-180" : ""}`} />
                      </button>
                      {detailsBugOuverts && (
                        <div className="px-4 pb-3">
                          {bug.titre && <p className="mb-1 text-sm font-semibold text-[#12151F]">{bug.titre}</p>}
                          <p className="mb-2 text-sm text-slate-600">{bug.description}</p>
                          {bug.captures.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {bug.captures.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-slate-200">
                                  <img src={url} alt={`Capture ${i + 1}`} className="h-14 w-20 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                </a>
                              ))}
                            </div>
                          )}
                          <p className="mt-2 text-[11px] text-slate-400">
                            {bug.captures.length > 0 ? `${bug.captures.length} capture(s) transmise(s) à l'agent` : "Aucune capture jointe"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {messages.map((m, i) => <BulleMessage key={i} message={m} />)}
                  <div ref={finChatRef} />
                </div>

                <form onSubmit={(e) => { e.preventDefault(); envoyerMessage(); }} className="border-t border-slate-200 bg-white p-3">
                  <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-300 focus-within:shadow-md transition-all">
                    <input
                      value={saisie}
                      onChange={(e) => setSaisie(e.target.value)}
                      placeholder="Demandez une correction à l'IA..."
                      disabled={enReflexion}
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
                    />
                    <Button type="submit" size="sm" disabled={enReflexion || !saisie.trim()} className="h-8 w-8 shrink-0 rounded-full bg-[#12151F] p-0 hover:bg-[#12151F]/90 shadow-sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-center text-[11px] text-slate-400">L'IA peut faire des erreurs. Vérifiez les propositions avant d'envoyer.</p>
                </form>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={chatOuvert ? 80 : 100} id="panel-workspace">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={70} minSize={35}>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2 bg-white">
                  {!chatOuvert && (
                    <button
                      onClick={() => setChatOuvert(true)}
                      title="Ouvrir l'assistant IA"
                      className="mr-2 flex items-center gap-1.5 rounded-full bg-[#12151F] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#1a1f2e] transition-colors"
                    >
                      <ArrowLeft/>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                      Assistant
                    </button>
                  )}
                  <OngletBouton actif={vue === "code"} onClick={() => setVue("code")} icone={Code2} label="Code" />
                  <OngletBouton actif={vue === "preview"} onClick={() => setVue("preview")} icone={Eye} label="Preview" />
                </div>

                <PanneauModifications modifications={modifications} onAccepter={accepterModification} onRejeter={rejeterModification} onVoir={(chemin) => { setFichierActif(chemin); setVue("code"); }} />

                <div className="flex flex-1 overflow-hidden">
                  {vue === "code" ? (
                    <ResizablePanelGroup orientation="horizontal" className="flex-1">
                      <ResizablePanel defaultSize={150} minSize={150} maxSize={200}>
                        <div className="h-full border-r border-slate-100 bg-slate-50/60 overflow-y-auto">
                          <div className="border-b border-slate-100 bg-white">
                            {/* {creationOuverte ? (
                              <div className="flex items-center gap-1.5 px-2 py-1.5">
                                {creationOuverte === "dossier" ? <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <FilePlus className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                                <input
                                  ref={creationInputRef}
                                  value={nomCreation}
                                  onChange={(e) => setNomCreation(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmerCreation();
                                    if (e.key === "Escape") { setCreationOuverte(null); setNomCreation(""); }
                                  }}
                                  onBlur={() => { if (!nomCreation.trim()) setCreationOuverte(null); }}
                                  placeholder={creationOuverte === "dossier" ? "nom-du-dossier" : "src/components/Fichier.tsx"}
                                  className="flex-1 rounded border border-blue-400 bg-white px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-200"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <button onClick={() => setCreationOuverte("fichier")} className="flex flex-1 items-center gap-1.5 px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50">
                                  <FilePlus className="h-3.5 w-3.5" /> Fichier
                                </button>
                                <button onClick={() => setCreationOuverte("dossier")} className="flex flex-1 items-center gap-1.5 border-l border-slate-100 px-3 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50">
                                  <FolderPlus className="h-3.5 w-3.5" /> Dossier
                                </button>
                              </div>
                            )} */}
                          </div> 
                          <FileTree fichiers={nomsFichiers} fichierActif={fichierActif} onSelect={setFichierActif} fichiersModifies={new Set(modifications.map((m) => m.cheminFichier))} />
                        </div>
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={100}>
                        <div className="flex h-full flex-col overflow-hidden">
                          {fichierActif && (
                            <div className="flex items-center justify-between gap-1 border-b border-slate-100 px-3 py-1.5 bg-white">
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                {fichierActif.split("/").map((segment, i, arr) => (
                                  <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <span className="text-slate-300">/</span>}
                                    <span className={i === arr.length - 1 ? "font-medium text-slate-600" : ""}>{segment}</span>
                                  </span>
                                ))}
                              </div>

                              {/* MODIFIÉ : seuls les boutons Accepter/Rejeter restent, plus de
                                  toggle Diff/Éditer — la vue s'adapte automatiquement au statut. */}
                              {modificationDuFichierActif?.statut === "en_attente" && (
                                <div className="flex items-center gap-1.5">
                                  <Button size="sm" variant="outline" onClick={() => rejeterModification(fichierActif)} className="h-6 gap-1 border-red-200 px-2 text-xs text-red-600 hover:bg-red-50">
                                    <XCircle className="h-3 w-3" /> Rejeter
                                  </Button>
                                  <Button size="sm" onClick={() => accepterModification(fichierActif)} className="h-6 gap-1 bg-emerald-600 px-2 text-xs hover:bg-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" /> Accepter
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            {!fichierActif ? (
                              <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucun fichier chargé</div>
                            ) : afficherEnDiff && modificationDuFichierActif ? (
                              <DiffEditor
                                height="100%"
                                original={modificationDuFichierActif.contenuOriginal}
                                modified={modificationDuFichierActif.contenuPropose}
                                theme="vs-dark"
                                options={{ fontSize: 13, readOnly: true, renderSideBySide: true, minimap: { enabled: false } }}
                              />
                            ) : (
                              <Editor height="100%" path={fichierActif} value={fichiers[fichierActif]} onChange={handleEditionManuelle} theme="vs-dark" options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 12 } }} />
                            )}
                          </div>
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : urlPreview ? (
                    <div className="relative h-full w-full">
                      <button
                        onClick={() => declencherRafraichissementPreview(true)}
                        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-600 shadow-sm backdrop-blur hover:bg-white"
                        title="Recharger l'aperçu depuis l'état actuel"
                      >
                        <RefreshCw className="h-3 w-3" /> Rafraîchir
                      </button>
                      <iframe key={previewVersion} src={urlPreview} className="h-full w-full bg-white" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin" /> En attente du démarrage du serveur...
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={15} minSize={10}>
              <div className="flex h-full flex-col bg-[#0B0D14]">
                <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
                  <TerminalSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Terminal</span>
                </div>
                <div ref={terminalRef} className="flex-1 overflow-hidden px-2 py-1" />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function OngletBouton({ actif, onClick, icone: Icone, label, disabled }: { actif: boolean; onClick: () => void; icone: React.ElementType; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${actif ? "bg-[#12151F] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
      <Icone className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function PanneauModifications({ modifications, onAccepter, onRejeter, onVoir }: { modifications: EtatModification[]; onAccepter: (chemin: string) => void; onRejeter: (chemin: string) => void; onVoir: (chemin: string) => void }) {
  const enAttente = modifications.filter((m) => m.statut === "en_attente");
  if (enAttente.length === 0) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-3 py-2">
      <p className="mb-1.5 text-xs font-medium text-amber-800">{enAttente.length} modification(s) proposée(s) — à valider</p>
      <div className="space-y-1.5">
        {enAttente.map((m) => (
          <div key={m.cheminFichier} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs">
            <button onClick={() => onVoir(m.cheminFichier)} className="min-w-0 flex-1 truncate text-left text-slate-700 hover:underline">{m.cheminFichier}</button>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="outline" onClick={() => onRejeter(m.cheminFichier)} className="h-6 gap-1 border-red-200 px-2 text-red-600 hover:bg-red-50"><XCircle className="h-3 w-3" /> Rejeter</Button>
              <Button size="sm" onClick={() => onAccepter(m.cheminFichier)} className="h-6 gap-1 bg-emerald-600 px-2 hover:bg-emerald-700"><CheckCircle2 className="h-3 w-3" /> Accepter</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulleMessage({ message }: { message: MessageChat }) {
  if (message.role === "user") {
    return <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-xs bg-[#12151F] px-4 py-2.5 text-sm text-white shadow-sm leading-relaxed">{message.contenu}</div></div>;
  }
  const config: Record<StatutMessage | "defaut", { icone: React.ElementType; classeIcone: string; classeFond: string }> = {
    en_cours: { icone: Loader2, classeIcone: "text-blue-500 animate-spin", classeFond: "bg-blue-50/80 border-blue-100 text-blue-900" },
    succes: { icone: CheckCircle2, classeIcone: "text-emerald-500", classeFond: "bg-white border-slate-200 text-slate-800 shadow-sm" },
    echec: { icone: XCircle, classeIcone: "text-red-500", classeFond: "bg-red-50/80 border-red-100 text-red-900" },
    defaut: { icone: Bot, classeIcone: "text-slate-400", classeFond: "bg-white border-slate-200 text-slate-800 shadow-sm" },
  };
  const { icone: Icone, classeIcone, classeFond } = config[message.statut ?? "defaut"];
  return (
    <div className="flex justify-start">
      <div className={`flex max-w-[90%] items-start gap-2.5 rounded-2xl rounded-bl-xs border px-4 py-3 text-sm leading-relaxed ${classeFond}`}>
        <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${classeIcone}`} />
        <span className="whitespace-pre-wrap">{message.contenu}</span>
      </div>
    </div>
  );
}