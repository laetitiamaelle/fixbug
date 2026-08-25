"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import Editor from "@monaco-editor/react";
import "xterm/css/xterm.css";
import {
  Send, Loader2, Code2, Eye, CheckCircle2, XCircle,
  Bot, ExternalLink, TerminalSquare, Sparkles, PanelLeftClose, PanelLeft, AlertCircle, ChevronDown
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

// AJOUT (point D) : remplace l'ancien `propositions: Proposition[]` plat.
// Chaque modification garde son contenu d'avant (pour pouvoir "Rejeter" = revenir en arrière)
// et un statut individuel, au lieu d'être appliquée automatiquement.
type EtatModification = {
  cheminFichier: string;
  contenuOriginal: string;
  contenuPropose: string;
  explication: string;
  statut: "en_attente" | "accepte" | "rejete";
};

export default function EspaceTravailPage() {
  const params = useParams();
  const bugId = params.id;

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

  // MODIFIÉ (point D) : `propositions` devient `modifications`, avec le nouveau type EtatModification
  const [modifications, setModifications] = useState<EtatModification[]>([]);

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [resultatPR, setResultatPR] = useState<ResultatPR>(null);
  const finChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, enReflexion]);

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

      const observer = new ResizeObserver(() => {
        try { fitAddon.fit(); } catch {}
      });
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
      // MODIFIÉ (point E) : on ne fait plus juste `setBug(data)`, on reconstruit aussi
      // le chat ET les dernières modifications connues à partir de `messagesDeveloppeur`
      // (nouveau champ JSON sur le modèle Bug — voir schema.prisma) pour que tout survive au F5.
      apiFetch(`/bugs/${bugId}`).then((data) => {
        setBug(data);

        const historique = (data.messagesDeveloppeur as any[]) ?? [];
        const messagesReconstruits: MessageChat[] = historique.map((m) => ({
          role: m.role,
          contenu: m.contenu,
          statut: m.role === "assistant" ? "succes" : undefined,
        }));
        if (messagesReconstruits.length > 0) {
          setMessages(messagesReconstruits);
        }

        const dernierTourAssistant = [...historique].reverse().find(
          (m) => m.role === "assistant" && m.propositions?.length,
        );
        if (dernierTourAssistant) {
          setModifications(
            dernierTourAssistant.propositions.map((p: Proposition) => ({
              cheminFichier: p.cheminFichier,
              // Limite connue : après reload on ne connaît plus le contenu exact d'avant
              // cette proposition (pas encore stocké côté backend). "Rejeter" restera donc
              // approximatif pour un historique rechargé, contrairement à la session en cours.
              contenuOriginal: "",
              contenuPropose: p.nouveauContenu,
              explication: p.explication,
              statut: "en_attente",
            })),
          );
        }
      }).catch(() => setBug(null));

      const recus: FichierRecu[] = await apiFetch(`/bugs/${bugId}/fichiers`);
      const carte = Object.fromEntries(recus.map((f) => [f.chemin, f.contenu]));
      setFichiers(carte);
      setFichierActif(recus[0]?.chemin ?? null);
      setStatutEnv(`${recus.length} fichiers récupérés — montage...`);

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
        prev.length > 0
          ? prev
          : [{
              role: "assistant",
              contenu: "Environnement prêt. Décrivez-moi ce que vous voulez corriger — je vais explorer le code et proposer une correction.",
              statut: "succes",
            }],
      );
    }

    demarrer().catch((err) => setStatutEnv("Erreur : " + err.message));
  }, [bugId]);

  async function appliquerDansWebContainer(props: Proposition[]) {
    const instance = instanceRef.current;
    if (!instance) return;
    for (const prop of props) {
      try {
        await instance.fs.writeFile(prop.cheminFichier, prop.nouveauContenu);
      } catch {
        // fichier hors de l'arborescence montée — ignoré
      }
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
        copie[copie.length - 1] = {
          role: "assistant",
          contenu: resumeIA,
          statut: nouvelles.length > 0 ? "succes" : "echec",
        };
        return copie;
      });

      if (nouvelles.length > 0) {
        // MODIFIÉ (point D) : on n'écrase plus `propositions`, on fusionne dans `modifications`
        // en gardant `contenuOriginal` = ce qu'il y avait avant CE tour précis, et un statut
        // "en_attente" — plus jamais appliqué automatiquement en "accepté".
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
            if (indexExistant >= 0) copie[indexExistant] = nouvelleEntree;
            else copie.push(nouvelleEntree);
          });
          return copie;
        });

        // On affiche quand même le résultat dans l'éditeur/preview pour que le développeur
        // puisse juger avant de décider — mais ce n'est pas encore "accepté".
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
        copie[copie.length - 1] = {
          role: "assistant",
          contenu: "Je n'ai pas pu traiter cette demande : " + (err instanceof Error ? err.message : "erreur inconnue"),
          statut: "echec",
        };
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
      for (const nom of ["dev", "start", "serve"]) {
        if (scripts[nom]) return ["npm", "run", nom];
      }
    } catch {}
    return null;
  }

  function handleEditionManuelle(nouveauContenu: string | undefined) {
    if (!fichierActif || nouveauContenu === undefined) return;
    setFichiers((prev) => ({ ...prev, [fichierActif]: nouveauContenu }));
    // MODIFIÉ : référence `modifications` au lieu de `propositions`
    setModifications((prev) =>
      prev.some((m) => m.cheminFichier === fichierActif)
        ? prev.map((m) => (m.cheminFichier === fichierActif ? { ...m, contenuPropose: nouveauContenu } : m))
        : prev,
    );
    instanceRef.current?.fs.writeFile(fichierActif, nouveauContenu).catch(() => {});
  }

  // AJOUT (point D) : les deux actions du panneau "Modifications proposées"
  function accepterModification(chemin: string) {
    setModifications((prev) => prev.map((m) => (m.cheminFichier === chemin ? { ...m, statut: "accepte" } : m)));
    toast.success(`Modification acceptée : ${chemin}`);
  }

  function rejeterModification(chemin: string) {
    const mod = modifications.find((m) => m.cheminFichier === chemin);
    if (!mod) return;

    // "Rejeter" = réécrire le contenu d'AVANT cette proposition, dans l'éditeur ET WebContainer,
    // pour que la preview reflète le vrai état du code.
    setFichiers((prev) => ({ ...prev, [chemin]: mod.contenuOriginal }));
    instanceRef.current?.fs.writeFile(chemin, mod.contenuOriginal).catch(() => {});
    setModifications((prev) => prev.map((m) => (m.cheminFichier === chemin ? { ...m, statut: "rejete" } : m)));
    toast.info(`Modification annulée : ${chemin}`);
  }

  async function envoyerSurGithub() {
    // MODIFIÉ (point D) : on n'envoie que ce qui a été explicitement accepté
    const modificationsAcceptees = modifications.filter((m) => m.statut === "accepte");
    if (modificationsAcceptees.length === 0) {
      toast.error("Acceptez au moins une modification avant d'envoyer sur GitHub.");
      return;
    }
    setEnvoiEnCours(true);
    try {
      const resultat = await apiFetch(`/bugs/${bugId}/valider-envoyer`, {
        method: "POST",
        body: JSON.stringify({
          propositions: modificationsAcceptees.map((m) => ({
            cheminFichier: m.cheminFichier,
            nouveauContenu: m.contenuPropose,
            explication: m.explication,
          })),
        }),
        headers: { "Content-Type": "application/json" },
      });
      setResultatPR({ url: resultat.urlPR, numeroPR: resultat.numeroPR });
      toast.success(`Pull Request #${resultat.numeroPR} créée`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi sur GitHub");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const nomsFichiers = Object.keys(fichiers);

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col gap-3 p-2 sm:p-4">
      {/* Barre supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
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
          {resultatPR && (
            <a
              href={resultatPR.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> PR #{resultatPR.numeroPR} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Button
            onClick={envoyerSurGithub}
            // MODIFIÉ : désactivé tant qu'aucune modification n'est "accepte" (plus juste "il existe des propositions")
            disabled={envoiEnCours || modifications.filter((m) => m.statut === "accepte").length === 0}
            size="sm"
            className="gap-1.5 bg-[#12151F] hover:bg-[#12151F]/90 text-xs sm:text-sm"
          >
            {envoiEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <IconeGithub className="h-3.5 w-3.5" />}
            {resultatPR ? "Mettre à jour PR" : "Créer la PR"}
          </Button>
        </div>
      </div>

      {/* Corps redimensionnable */}
      
      <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {chatOuvert && (
          <>
            <ResizablePanel defaultSize={250} minSize={150} maxSize={300} id="panel-chat">
              <div className="flex h-full flex-col bg-slate-50/30">
                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-[#12151F]">Assistant Fixbug</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      IA Active
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setChatOuvert(false)}
                      title="Masquer le chat"
                      className="h-7 w-7 text-slate-500 hover:bg-slate-100"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {bug && (
                    <div className="border-b border-slate-100 bg-white">
                      <button
                        onClick={() => setDetailsBugOuverts((v) => !v)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" /> Détails du bug signalé
                        </span>
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
                  {messages.map((m, i) => (
                    <BulleMessage key={i} message={m} />
                  ))}
                  <div ref={finChatRef} />
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); envoyerMessage(); }}
                  className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
                >
                  <input
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    placeholder="Décrivez ce qu'il faut corriger..."
                    disabled={enReflexion}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none transition-colors focus:border-[#12151F] focus:bg-white disabled:opacity-60"
                  />
                  <Button type="submit" size="sm" disabled={enReflexion || !saisie.trim()} className="h-9 w-9 shrink-0 rounded-lg bg-[#12151F] p-0 hover:bg-[#12151F]/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={chatOuvert ? 80 : 100} id="panel-workspace">
          {/* MODIFIÉ (point B) */}
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={70} minSize={35}>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2 bg-white">
                  {!chatOuvert && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setChatOuvert(true)}
                      title="Afficher le chat"
                      className="h-8 w-8 text-slate-600 hover:bg-slate-100 mr-10"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  )}

                  <OngletBouton actif={vue === "code"} onClick={() => setVue("code")} icone={Code2} label="Code" />
                  <OngletBouton actif={vue === "preview"} onClick={() => setVue("preview")} icone={Eye} label="Preview" />
                </div>

                {/* AJOUT (point D) : le panneau des modifications en attente, juste au-dessus
                    de la zone code/preview — il se masque tout seul s'il n'y a rien en attente. */}
                <PanneauModifications
                  modifications={modifications}
                  onAccepter={accepterModification}
                  onRejeter={rejeterModification}
                  onVoir={(chemin) => { setFichierActif(chemin); setVue("code"); }}
                />

                <div className="flex flex-1 overflow-hidden">
                  {vue === "code" ? (
                    // MODIFIÉ (point B)
                    <ResizablePanelGroup orientation="horizontal" className="flex-1">
                      <ResizablePanel defaultSize={150} minSize={150} maxSize={200}>
                        <div className="h-full border-r border-slate-100 bg-slate-50/60 overflow-y-auto">
                          <FileTree
                            fichiers={nomsFichiers}
                            fichierActif={fichierActif}
                            onSelect={setFichierActif}
                            // MODIFIÉ : référence `modifications` au lieu de `propositions`
                            fichiersModifies={new Set(modifications.map((m) => m.cheminFichier))}
                          />
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
                              <Editor
                                height="100%"
                                path={fichierActif}
                                value={fichiers[fichierActif]}
                                onChange={handleEditionManuelle}
                                theme="vs-dark"
                                options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 12 } }}
                              />
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
                      <Loader2 className="h-5 w-5 animate-spin" />
                      En attente du démarrage du serveur...
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

function OngletBouton({
  actif, onClick, icone: Icone, label, disabled,
}: { actif: boolean; onClick: () => void; icone: React.ElementType; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${actif ? "bg-[#12151F] text-white" : "text-slate-500 hover:bg-slate-100"
        }`}
    >
      <Icone className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// AJOUT (point D) : nouveau composant, défini au même niveau que BulleMessage/OngletBouton
function PanneauModifications({
  modifications, onAccepter, onRejeter, onVoir,
}: {
  modifications: EtatModification[];
  onAccepter: (chemin: string) => void;
  onRejeter: (chemin: string) => void;
  onVoir: (chemin: string) => void;
}) {
  const enAttente = modifications.filter((m) => m.statut === "en_attente");
  if (enAttente.length === 0) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-3 py-2">
      <p className="mb-1.5 text-xs font-medium text-amber-800">
        {enAttente.length} modification(s) proposée(s) — à valider
      </p>
      <div className="space-y-1.5">
        {enAttente.map((m) => (
          <div key={m.cheminFichier} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs">
            <button onClick={() => onVoir(m.cheminFichier)} className="min-w-0 flex-1 truncate text-left text-slate-700 hover:underline">
              {m.cheminFichier}
            </button>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="outline" onClick={() => onRejeter(m.cheminFichier)} className="h-6 gap-1 border-red-200 px-2 text-red-600 hover:bg-red-50">
                <XCircle className="h-3 w-3" /> Rejeter
              </Button>
              <Button size="sm" onClick={() => onAccepter(m.cheminFichier)} className="h-6 gap-1 bg-emerald-600 px-2 hover:bg-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Accepter
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulleMessage({ message }: { message: MessageChat }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-[#12151F] px-4 py-2.5 text-sm text-white shadow-sm leading-relaxed">
          {message.contenu}
        </div>
      </div>
    );
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