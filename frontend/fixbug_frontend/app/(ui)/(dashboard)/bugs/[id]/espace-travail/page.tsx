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
  Bot, ExternalLink, TerminalSquare, Sparkles,
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

  // --- Chat / IA ---
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [saisie, setSaisie] = useState("");
  const [enReflexion, setEnReflexion] = useState(false);
  const [propositions, setPropositions] = useState<Proposition[]>([]);
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
    }
    window.addEventListener("resize", () => fitAddon.fit());

    terminal.onData((data) => {
      const processus = processusActifRef.current;
      if (processus) {
        const writer = processus.input.getWriter();
        writer.write(data);
        writer.releaseLock();
      }
    });

    async function demarrer() {
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

        setStatutEnv("Démarrage du serveur de développement...");
        const dev = await instance.spawn("npm", ["run", "dev"]);
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

      setMessages([
        {
          role: "assistant",
          contenu: "Environnement prêt. Décrivez-moi ce que vous voulez corriger — je vais explorer le code et proposer une correction.",
          statut: "succes",
        },
      ]);
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
        setPropositions(nouvelles);
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

  function handleEditionManuelle(nouveauContenu: string | undefined) {
    if (!fichierActif || nouveauContenu === undefined) return;
    setFichiers((prev) => ({ ...prev, [fichierActif]: nouveauContenu }));
    setPropositions((prev) =>
      prev.some((p) => p.cheminFichier === fichierActif)
        ? prev.map((p) => (p.cheminFichier === fichierActif ? { ...p, nouveauContenu } : p))
        : prev,
    );
    instanceRef.current?.fs.writeFile(fichierActif, nouveauContenu).catch(() => {});
  }

  async function envoyerSurGithub() {
    if (propositions.length === 0) {
      toast.error("Aucune proposition validée à envoyer pour le moment.");
      return;
    }
    setEnvoiEnCours(true);
    try {
      const resultat = await apiFetch(`/bugs/${bugId}/valider-envoyer`, {
        method: "POST",
        body: JSON.stringify({ propositions }),
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
    <div className="flex h-[calc(100vh-96px)] flex-col gap-3">
      {/* Barre supérieure */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
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
            disabled={envoiEnCours || propositions.length === 0}
            size="sm"
            className="gap-1.5 bg-[#12151F] hover:bg-[#12151F]/90"
          >
            {envoiEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <IconeGithub className="h-3.5 w-3.5" />}
            {resultatPR ? "Mettre à jour la Pull Request" : "Créer la Pull Request"}
          </Button>
        </div>
      </div>

      {/* Corps redimensionnable */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Chat */}
        <ResizablePanel defaultSize={30} minSize={22} maxSize={45}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Bot className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-[#12151F]">Assistant Fixbug</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((m, i) => (
                <BulleMessage key={i} message={m} />
              ))}
              <div ref={finChatRef} />
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); envoyerMessage(); }}
              className="flex items-center gap-2 border-t border-slate-100 p-2.5"
            >
              <input
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder="Décrivez ce qu'il faut corriger..."
                disabled={enReflexion}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#12151F] disabled:opacity-60"
              />
              <Button type="submit" size="sm" disabled={enReflexion || !saisie.trim()} className="h-9 w-9 shrink-0 rounded-full bg-[#12151F] p-0 hover:bg-[#12151F]/90">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Code / Preview + Terminal */}
        <ResizablePanel defaultSize={70}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={72} minSize={35}>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2">
                  <OngletBouton actif={vue === "code"} onClick={() => setVue("code")} icone={Code2} label="Code" />
                  <OngletBouton actif={vue === "preview"} onClick={() => setVue("preview")} icone={Eye} label="Preview" disabled={!urlPreview} />
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {vue === "code" ? (
                    <>
                      <div className="w-56 shrink-0 border-r border-slate-100 bg-slate-50/60">
                        <FileTree
                          fichiers={nomsFichiers}
                          fichierActif={fichierActif}
                          onSelect={setFichierActif}
                          fichiersModifies={new Set(propositions.map((p) => p.cheminFichier))}
                        />
                      </div>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        {fichierActif && (
                          <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-1.5 text-xs text-slate-400">
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
                    </>
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

            {/* Terminal */}
            <ResizablePanel defaultSize={28} minSize={12}>
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
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        actif ? "bg-[#12151F] text-white" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      <Icone className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function BulleMessage({ message }: { message: MessageChat }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#12151F] px-3.5 py-2.5 text-sm text-white">
          {message.contenu}
        </div>
      </div>
    );
  }

  const config: Record<StatutMessage | "defaut", { icone: React.ElementType; classeIcone: string; classeFond: string }> = {
    en_cours: { icone: Loader2, classeIcone: "text-blue-500 animate-spin", classeFond: "bg-blue-50/60 border-blue-100" },
    succes: { icone: CheckCircle2, classeIcone: "text-emerald-500", classeFond: "bg-slate-50 border-slate-100" },
    echec: { icone: XCircle, classeIcone: "text-red-500", classeFond: "bg-red-50/60 border-red-100" },
    defaut: { icone: Bot, classeIcone: "text-slate-400", classeFond: "bg-slate-50 border-slate-100" },
  };
  const { icone: Icone, classeIcone, classeFond } = config[message.statut ?? "defaut"];

  return (
    <div className="flex justify-start">
      <div className={`flex max-w-[90%] items-start gap-2 rounded-2xl rounded-bl-sm border px-3.5 py-2.5 text-sm text-slate-700 ${classeFond}`}>
        <Icone className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${classeIcone}`} />
        <span>{message.contenu}</span>
      </div>
    </div>
  );
}