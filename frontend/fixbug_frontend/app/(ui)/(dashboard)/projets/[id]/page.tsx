"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Send, Paperclip, X, Plus, Bug, Clock, AlertCircle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type BugItem = {
  id: number; titre: string | null; description: string; captures: string[];
  statut: "EN_COURS_DE_TRAITEMENT" | "EN_ATTENTE_VALIDATION" | "BLOQUE" | "RESOLU";
  createdAt: string; testeur: { id: number; nom: string; prenom: string };
};

type Message = {
  key: string;
  role: "user" | "bot";
  bugId?: number;
  titre?: string | null;
  description: string;
  captures?: string[];
  statut?: BugItem["statut"];
  createdAt?: string;
  testeur?: BugItem["testeur"];
  pending?: boolean;
  echec?: boolean;
  fichiers?: File[];
};

const configStatut = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700" },
  EN_ATTENTE_VALIDATION: { label: "En attente de validation", icone: AlertCircle, classe: "bg-amber-50 text-amber-700" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700" },
  RESOLU: { label: "Résolu", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700" },
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

export default function ApercuProjetPage() {
  const params = useParams();
  const [bugs, setBugs] = useState<BugItem[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selection, setSelection] = useState<BugItem | "nouveau">("nouveau");
  const [description, setDescription] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const msgRefs = useRef(new Map<string, HTMLDivElement>());
  const finChatRef = useRef<HTMLDivElement>(null);

  function bugsVersMessages(liste: BugItem[]): Message[] {
    const msgs: Message[] = [];
    [...liste]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((b) => {
        msgs.push({ key: `bug-${b.id}`, role: "user", bugId: b.id, titre: b.titre, description: b.description, captures: b.captures, statut: b.statut, testeur: b.testeur, createdAt: b.createdAt });
       
      });
    return msgs;
  }

  function chargerBugs() {
    apiFetch(`/bugs?projetId=${params.id}`)
      .then((data: BugItem[]) => { setBugs(data); setMessages(bugsVersMessages(data)); })
      .catch(() => { setBugs([]); setMessages([]); });
  }
  useEffect(() => { chargerBugs(); }, [params.id]);

  useEffect(() => {
    if (selection === "nouveau") {
      finChatRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, selection]);

  function voirBug(bug: BugItem) {
    setSelection(bug);
    setTimeout(() => msgRefs.current.get(`bug-${bug.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  function handleAjoutFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFichiers([...fichiers, ...Array.from(e.target.files)]);
  }

  async function declarerBug(contenu: string, fichiersListe: File[], messageKey?: string) {
    setEnvoi(true);
    try {
      const formData = new FormData();
      formData.append("description", contenu);
      formData.append("projetId", String(params.id));
      fichiersListe.forEach((f) => formData.append("captures", f));
      await apiFetch("/bugs", { method: "POST", body: formData });
      toast.success("Bug déclaré avec succès");
      setDescription(""); setFichiers([]);
      chargerBugs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la déclaration");
      if (messageKey) {
        setMessages((prev) => prev.map((m) => m.key === messageKey ? { ...m, pending: false, echec: true } : m));
      }
    } finally {
      setEnvoi(false);
    }
  }

  function handleEnvoyer(e?: React.FormEvent) {
    e?.preventDefault();
    if (!description.trim() || envoi) return;
    const contenu = description;
    const files = [...fichiers];
    const key = `temp-${Date.now()}`;
    const urls = files.map((f) => URL.createObjectURL(f));
    setMessages((prev) => [...prev, { key, role: "user", description: contenu, captures: urls, fichiers: files, pending: true, createdAt: new Date().toISOString() }]);
    setDescription(""); setFichiers([]); setSelection("nouveau");
    declarerBug(contenu, files, key);
  }

  function retryMessage(msg: Message) {
    setMessages((prev) => prev.map((m) => m.key === msg.key ? { ...m, pending: true, echec: false } : m));
    declarerBug(msg.description, msg.fichiers ?? [], msg.key);
  }

  return (
    <div className="grid h-[calc(100vh-190px)] grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
      {/* Historique */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-3">
          <Button onClick={() => setSelection("nouveau")} size="sm" className="w-full justify-start bg-[#12151F] hover:bg-[#12151F]/90">
            <Plus className="mr-2 h-4 w-4" /> Nouveau bug
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-2">
            {bugs === null ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
            ) : bugs.length === 0 ? (
              <p className="p-3 text-center text-xs text-slate-400">Aucun bug déclaré.</p>
            ) : (
              bugs.map((bug) => {
                const statut = configStatut[bug.statut];
                const actif = selection !== "nouveau" && selection.id === bug.id;
                return (
                  <button
                    key={bug.id}
                    onClick={() => voirBug(bug)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${actif ? "bg-slate-100" : "hover:bg-slate-50"}`}
                  >
                
                    <span className="truncate text-[#12151F]">{bug.titre || bug.description.slice(0, 28)}</span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-5">
            {/* Message d'accueil */}
            <div className="flex items-end gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Bug className="h-4 w-4" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                <p className="text-sm text-slate-700">Bonjour, je suis l'assistant de signalement. Décrivez le bug rencontré ci-dessous, joignez des captures si besoin. Votre historique s'affichera ici.</p>
              </div>
            </div>

            {messages.map((msg) =>
              msg.role === "user" ? (
                <div
                  key={msg.key}
                  ref={(el) => { if (el) msgRefs.current.set(msg.key, el); else msgRefs.current.delete(msg.key); }}
                  className="flex justify-end"
                >
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#12151F] px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm text-white">{msg.description}</p>
                    {msg.captures && msg.captures.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.captures.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-white/10">
                            <img src={url} alt="" className="h-20 w-28 object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] text-white/60">
                      {msg.pending ? <Clock className="h-3 w-3" /> : msg.echec ? <XCircle className="h-3 w-3 text-red-400" /> : <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                    {msg.echec && (
                      <button type="button" onClick={() => retryMessage(msg)} className="mt-2 flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30">
                        <RotateCcw className="h-3 w-3" /> Réessayer
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div key={msg.key} className="flex items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Bug className="h-4 w-4" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                    <p className="mb-1.5 text-sm text-slate-700">
                      Votre signalement{msg.bugId ? ` #${msg.bugId}` : ""} a bien été pris en compte.
                    </p>
                    {msg.statut && (() => { const s = configStatut[msg.statut]; const I = s.icone; return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${s.classe}`}>
                        <I className="h-3 w-3" /> {s.label}
                      </span>
                    ); })()}
                    {msg.createdAt && <p className="mt-1.5 text-[11px] text-slate-400">{formatDate(msg.createdAt)}</p>}
                  </div>
                </div>
              )
            )}

            {envoi && (
              <div className="flex items-end gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Bug className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={finChatRef} />
          </div>
        </ScrollArea>

        {/* Barre de saisie toujours visible, façon chat */}
        <form onSubmit={handleEnvoyer} className="p-3">
          {fichiers.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 px-1">
              {fichiers.map((fichier, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-2 text-sm">
                  <span className="max-w-[160px] truncate text-slate-600">{fichier.name}</span>
                  <button type="button" onClick={() => setFichiers(fichiers.filter((_, i) => i !== index))}>
                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 focus-within:border-slate-400">
            <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-200">
              <Paperclip className="h-4 w-4" />
              <input type="file" accept="image/*" multiple onChange={handleAjoutFichiers} className="hidden" />
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le bug rencontré..."
              rows={1}
              className="max-h-32 flex-1 resize-none border-none bg-transparent py-2 text-sm outline-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnvoyer(e); } }}
            />
            <Button type="submit" disabled={envoi || !description.trim()} className="h-9 w-9 shrink-0 rounded-full bg-[#12151F] p-0 hover:bg-[#12151F]/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}