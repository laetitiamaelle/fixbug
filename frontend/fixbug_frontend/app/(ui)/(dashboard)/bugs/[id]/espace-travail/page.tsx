"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import Editor from "@monaco-editor/react";
import "xterm/css/xterm.css";
import {
  Send, Loader2, Code2, Eye, CheckCircle2, XCircle,
  Bot, ExternalLink, TerminalSquare, Sparkles, PanelLeftClose, PanelLeft, AlertCircle, ChevronDown,
  GitBranch, GitPullRequest, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { apiFetch } from "@/lib/api";
import { construireArborescenceWebContainer } from "@/lib/construire-arborescence";
import { FileTree } from "../../../../../components/file-tree";
import { IconeGithub } from "@/app/components/icone-github";
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

// NOUVEAU : forme exacte de ce qu'on écrit/lit dans localStorage
type CacheWorkspace = {
  fichiers: Record<string, string>;
  modifications: EtatModification[];
  branchePoussee: string | null; // NOUVEAU : sait si on a déjà poussé, même après un F5
};

export default function EspaceTravailPage() {
  const params = useParams();
  const bugId = params.id;
  const cleCache = `fixbug-workspace-${bugId}`; // NOUVEAU : une clé de cache par bug

  // --- Environnement / fichiers ---
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

  // --- Chat ---
  const [chatOuvert, setChatOuvert] = useState(false);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [saisie, setSaisie] = useState("");
  const [enReflexion, setEnReflexion] = useState(false);
  const [modifications, setModifications] = useState<EtatModification[]>([]);

  // --- GitHub, en 2 étapes distinctes ---
  const [branchePoussee, setBranchePoussee] = useState<string | null>(null); // NOUVEAU : null tant que rien n'est poussé
  const [pushEnCours, setPushEnCours] = useState(false); // NOUVEAU
  const [prEnCours, setPrEnCours] = useState(false); // remplace envoiEnCours
  const [resultatPR, setResultatPR] = useState<ResultatPR>(null);
  const finChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, enReflexion]);

  // NOUVEAU : sauvegarde automatique dans localStorage à chaque changement pertinent —
  // c'est ce qui permet de ne jamais perdre le travail en cours au rechargement de page.
  useEffect(() => {
    if (Object.keys(fichiers).length === 0) return; // rien à sauver tant que rien n'est chargé
    try {
      const cache: CacheWorkspace = { fichiers, modifications, branchePoussee };
      localStorage.setItem(cleCache, JSON.stringify(cache));
    } catch {
      // localStorage plein/indisponible — pas bloquant, on continue sans cache cette fois
    }
  }, [fichiers, modifications, branchePoussee, cleCache]);

  // --- Montage WebContainer ---
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
      const observer = new ResizeObserver(() => { try { fitAddon.fit(); } catch {} });
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
      // Récupère le bug + reconstruit le chat développeur (persisté côté backend)
      apiFetch(`/bugs/${bugId}`).then((data) => {
        setBug(data);
        // NOUVEAU : si le backend sait déjà qu'une branche a été poussée (ex: après F5
        // AVANT que le cache localStorage existe, ou navigateur différent), on le reflète.
        if (data.branchePoussee && !branchePoussee) setBranchePoussee(data.branchePoussee);
        if (data.urlPR) setResultatPR({ url: data.urlPR, numeroPR: data.numeroPR });

        const historique = (data.messagesDeveloppeur as any[]) ?? [];
        const messagesReconstruits: MessageChat[] = historique.map((m) => ({
          role: m.role, contenu: m.contenu, statut: m.role === "assistant" ? "succes" : undefined,
        }));
        if (messagesReconstruits.length > 0) setMessages(messagesReconstruits);
      }).catch(() => setBug(null));

      // NOUVEAU : on regarde d'abord le cache local avant d'aller chercher sur GitHub
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
      setFichierActif(recus[0]?.chemin ?? null);

      const arborescence = construireArborescenceWebContainer(recus);
      const instance = await getWebContainerInstance();
      instanceRef.current = instance;
      await instance.mount(arborescence);

      const aUnPackageJson = recus.some((f) => f.chemin === "package.json");

      if (aUnPackageJson) {
        setStatutEnv("Installation des dépendances...");
        const install = await instance.spawn("npm", ["install"]);
        processusActifRef.current = install;
        install.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));
        await install.exit;

        const commande = detecterCommandeDemarrage(recus);
        if (!commande) {
          setStatutEnv(" Aucun script dev/start/serve trouvé dans package.json");
          return;
        }
        setStatutEnv(`Démarrage (${commande.join(" ")})...`);
        const dev = await instance.spawn(commande[0], commande.slice(1));
        processusActifRef.current = dev;
        dev.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));
      } else {
        setStatutEnv("Projet statique — démarrage du serveur...");
        const serveur = await instance.spawn("npx", ["-y", "serve", "-l", "3111"]);
        processusActifRef.current = serveur;
        serveur.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));
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

  // NOUVEAU : repartir de zéro, en abandonnant le cache local et les modifications en cours
  function reinitialiserDepuisGithub() {
    localStorage.removeItem(cleCache);
    window.location.reload();
  }

  async function appliquerDansWebContainer(props: Proposition[]) {
    const instance = instanceRef.current;
    if (!instance) return;
    for (const prop of props) {
      try { await instance.fs.writeFile(prop.cheminFichier, prop.nouveauContenu); } catch {}
    }
  }

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
      const resultat = await apiFetch(`/bugs/${bugId}/demander-analyse`, {
        method: "PATCH",
        body: JSON.stringify({ instructionDeveloppeur: contenu }),
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

        setFichiers((prev) => {
          const c = { ...prev };
          nouvelles.forEach((p: Proposition) => { c[p.cheminFichier] = p.nouveauContenu; });
          return c;
        });
        setFichierActif(nouvelles[0].cheminFichier);
        setVue("code");
        await appliquerDansWebContainer(nouvelles);
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
    } catch {}
    return null;
  }

  function handleEditionManuelle(nouveauContenu: string | undefined) {
    if (!fichierActif || nouveauContenu === undefined) return;
    setFichiers((prev) => ({ ...prev, [fichierActif]: nouveauContenu }));
    setModifications((prev) =>
      prev.some((m) => m.cheminFichier === fichierActif)
        ? prev.map((m) => (m.cheminFichier === fichierActif ? { ...m, contenuPropose: nouveauContenu } : m))
        : prev,
    );
    instanceRef.current?.fs.writeFile(fichierActif, nouveauContenu).catch(() => {});
  }

  function accepterModification(chemin: string) {
    setModifications((prev) => prev.map((m) => (m.cheminFichier === chemin ? { ...m, statut: "accepte" } : m)));
    toast.success(`Modification acceptée : ${chemin}`);
  }

  function rejeterModification(chemin: string) {
    const mod = modifications.find((m) => m.cheminFichier === chemin);
    if (!mod) return;
    setFichiers((prev) => ({ ...prev, [chemin]: mod.contenuOriginal }));
    instanceRef.current?.fs.writeFile(chemin, mod.contenuOriginal).catch(() => {});
    setModifications((prev) => prev.map((m) => (m.cheminFichier === chemin ? { ...m, statut: "rejete" } : m)));
    toast.info(`Modification annulée : ${chemin}`);
  }

  // NOUVEAU : étape 1 — pousser sur GitHub (branche + commits), sans créer de PR
  async function pousserSurGithub() {
    const modificationsAcceptees = modifications.filter((m) => m.statut === "accepte");
    if (modificationsAcceptees.length === 0) {
      toast.error("Acceptez au moins une modification avant de pousser sur GitHub.");
      return;
    }
    setPushEnCours(true);
    try {
      const resultat = await apiFetch(`/bugs/${bugId}/pousser-github`, {
        method: "POST",
        body: JSON.stringify({
          propositions: modificationsAcceptees.map((m) => ({ cheminFichier: m.cheminFichier, nouveauContenu: m.contenuPropose, explication: m.explication })),
        }),
        headers: { "Content-Type": "application/json" },
      });
      setBranchePoussee(resultat.branchePoussee);
      toast.success(`Modifications poussées sur la branche ${resultat.branchePoussee}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du push sur GitHub");
    } finally {
      setPushEnCours(false);
    }
  }

  // NOUVEAU : étape 2 — créer la PR, uniquement possible après un push réussi
  async function creerPullRequest() {
    if (!branchePoussee) {
      toast.error("Poussez d'abord vos modifications sur GitHub.");
      return;
    }
    setPrEnCours(true);
    try {
      const resultat = await apiFetch(`/bugs/${bugId}/creer-pull-request`, { method: "POST" });
      setResultatPR({ url: resultat.urlPR, numeroPR: resultat.numeroPR });
      toast.success(`Pull Request #${resultat.numeroPR} créée`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création de la Pull Request");
    } finally {
      setPrEnCours(false);
    }
  }

  const nomsFichiers = Object.keys(fichiers);

  return (
    <div className="relative flex h-[calc(100vh-64px)] -m-6 flex-col gap-0 overflow-hidden bg-slate-50/30">
      {/* Barre supérieure — moderne, sticky, glass effect */}
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
            <p className="text-sm font-semibold text-[#12151F]">Espace de travail — Bug #{bugId}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${envPret ? "bg-emerald-500" : "animate-pulse bg-amber-400"}`} />
              {statutEnv}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {resultatPR ? (
            // Une PR existe déjà : on affiche juste le lien, plus d'action à faire
            <a href={resultatPR.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" /> PR #{resultatPR.numeroPR} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <>
              {/* NOUVEAU : étape 1, toujours visible */}
              <Button
                onClick={pousserSurGithub}
                disabled={pushEnCours || modifications.filter((m) => m.statut === "accepte").length === 0}
                size="sm"
                variant={branchePoussee ? "outline" : "default"}
                className={`gap-1.5 text-xs sm:text-sm ${branchePoussee ? "" : "bg-[#12151F] hover:bg-[#12151F]/90"}`}
              >
                {pushEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
                {branchePoussee ? "Repousser sur GitHub" : "Pousser sur GitHub"}
              </Button>

              {/* NOUVEAU : étape 2, désactivée tant que rien n'est poussé */}
              <Button
                onClick={creerPullRequest}
                disabled={prEnCours || !branchePoussee}
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
                title={!branchePoussee ? "Poussez d'abord vos modifications sur GitHub" : undefined}
              >
                {prEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitPullRequest className="h-3.5 w-3.5" />}
                Créer la Pull Request
              </Button>
            </>
          )}
        </div>
      </div>

      {branchePoussee && !resultatPR && (
        <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          <GitBranch className="h-3 w-3" /> Modifications poussées sur <code className="font-mono">{branchePoussee}</code> — vous pouvez maintenant créer la Pull Request.
        </div>
      )}

      {/* Corps redimensionnable — inchangé à partir d'ici */}
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
                          <FileTree fichiers={nomsFichiers} fichierActif={fichierActif} onSelect={setFichierActif} fichiersModifies={new Set(modifications.map((m) => m.cheminFichier))} />
                        </div>
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={100}>
                        <div className="flex h-full flex-col overflow-hidden">
                          {fichierActif && (
                            <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-1.5 text-xs text-slate-400 bg-white">
                              {fichierActif.split("/").map((segment, i, arr) => (
                                <span key={i} className="flex items-center gap-1">
                                  {i > 0 && <span className="text-slate-300">/</span>}
                                  <span className={i === arr.length - 1 ? "font-medium text-slate-600" : ""}>{segment}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex-1">
                            {fichierActif ? (
                              <Editor height="100%" path={fichierActif} value={fichiers[fichierActif]} onChange={handleEditionManuelle} theme="vs-dark" options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 12 } }} />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucun fichier chargé</div>
                            )}
                          </div>
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : urlPreview ? (
                    <iframe src={urlPreview} className="h-full w-full bg-white" />
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