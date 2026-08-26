"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Send, Paperclip, X, Bug, Clock, AlertCircle, CheckCircle2, XCircle, Loader2, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const configStatut = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700 border-blue-200" },
  EN_ATTENTE_VALIDATION: { label: "Correction en cours de vérification", icone: AlertCircle, classe: "bg-amber-50 text-amber-700 border-amber-200" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700 border-red-200" },
  RESOLU: { label: "Corrigé ✓", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700 border-emerald-200" },
} as const;
type Statut = keyof typeof configStatut;

type MessageStocke = {
  role: "user" | "assistant";
  contenu: string;
  captures?: string[];
  bugId?: number;
  bugTitre?: string;
  bugStatut?: Statut;
  createdAt: string;
};

type ConversationResume = { id: number; titre: string | null; updatedAt: string };
type ConversationComplete = ConversationResume & { messages: MessageStocke[] };

const formatHeure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const formatDateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

export default function ApercuTesteur() {
  const params = useParams();
  const projetId = params.id;

  const [conversations, setConversations] = useState<ConversationResume[] | null>(null);
  const [conversationActiveId, setConversationActiveId] = useState<number | null>(null);

  const [messages, setMessages] = useState<MessageStocke[]>([]);
  const [chargementConversation, setChargementConversation] = useState(false);

  const [saisie, setSaisie] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [enAttente, setEnAttente] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chargerConversations = useCallback(() => {
    apiFetch(`/conversations?projetId=${projetId}`)
      .then((data: ConversationResume[]) => setConversations(data))
      .catch(() => setConversations([]));
  }, [projetId]);

  useEffect(() => { chargerConversations(); }, [chargerConversations]);

  async function ouvrirConversation(id: number) {
    setConversationActiveId(id);
    setChargementConversation(true);
    try {
      const conv: ConversationComplete = await apiFetch(`/conversations/${id}`);
      setMessages(conv.messages ?? []);
    } catch {
      toast.error("Impossible de charger cette conversation");
    } finally {
      setChargementConversation(false);
    }
  }

  async function nouvelleConversation() {
    try {
      const conv: ConversationComplete = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ projetId: String(projetId) }),
        headers: { "Content-Type": "application/json" },
      });
      setConversations((prev) => (prev ? [{ id: conv.id, titre: conv.titre, updatedAt: conv.updatedAt }, ...prev] : [conv]));
      setConversationActiveId(conv.id);
      setMessages([]);
      setSaisie("");
      setFichiers([]);
    } catch {
      toast.error("Impossible de créer une nouvelle conversation");
    }
  }

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, enAttente]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [saisie]);

  function handleAjoutFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFichiers([...fichiers, ...Array.from(e.target.files)]);
    e.target.value = "";
  }

  async function envoyerMessage() {
    if (!saisie.trim() || enAttente) return;

    let idCible = conversationActiveId;
    if (!idCible) {
      const conv: ConversationComplete = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ projetId: String(projetId) }),
        headers: { "Content-Type": "application/json" },
      });
      idCible = conv.id;
      setConversationActiveId(conv.id);
      setConversations((prev) => (prev ? [{ id: conv.id, titre: conv.titre, updatedAt: conv.updatedAt }, ...prev] : [conv]));
    }

    const texte = saisie;
    const fichiersEnvoyes = [...fichiers];
    const previewsLocales = fichiersEnvoyes.map((f) => URL.createObjectURL(f));

    setMessages((prev) => [
      ...prev,
      { role: "user", contenu: texte, captures: previewsLocales, createdAt: new Date().toISOString() },
      { role: "assistant", contenu: "Analyse en cours...", createdAt: new Date().toISOString() },
    ]);
    setSaisie("");
    setFichiers([]);
    setEnAttente(true);

    try {
      const formData = new FormData();
      formData.append("message", texte);
      fichiersEnvoyes.forEach((f) => formData.append("captures", f));

      const convMiseAJour: ConversationComplete = await apiFetch(`/conversations/${idCible}/messages`, { method: "POST", body: formData });

      setMessages(convMiseAJour.messages);
      // Les aperçus locaux (blob:) sont remplacés par les vraies URL du serveur : on les libère.
      previewsLocales.forEach((url) => URL.revokeObjectURL(url));

      setConversations((prev) =>
        prev
          ? prev
            .map((c) => (c.id === convMiseAJour.id ? { id: c.id, titre: convMiseAJour.titre, updatedAt: convMiseAJour.updatedAt } : c))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          : prev,
      );
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1).concat({ role: "assistant", contenu: "Une erreur est survenue, réessayez.", createdAt: new Date().toISOString() }));
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEnAttente(false);
    }
  }

  return (
    <div className="grid h-[calc(100vh-140px)] grid-cols-1 gap-3 md:grid-cols-[280px_1fr]">
      {/* Sidebar ChatGPT-like — historique */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F9FAFB] shadow-sm">
        <div className="border-b border-slate-200 bg-white p-3">
          <Button onClick={nouvelleConversation} size="sm" className="w-full justify-center gap-2 bg-[#12151F] hover:bg-[#12151F]/90 shadow-sm">
            <Plus className="h-4 w-4" /> Nouveau signalement
          </Button>
          <p className="mt-2 text-[11px] text-center text-slate-400">Chat contextuel du projet</p>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {conversations === null ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-xl" />)
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Aucune conversation. Cliquez sur "Nouveau chat" pour commencer.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const actif = conversationActiveId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => ouvrirConversation(conv.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${actif ? "bg-[#12151F] text-white shadow-sm" : "text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"
                      }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${actif ? "bg-white/10" : "bg-slate-200"}`}>
                      <MessageSquare className={`h-3.5 w-3.5 ${actif ? "text-white" : "text-slate-500"}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{conv.titre || "Nouvelle conversation"}</span>
                      <span className={`block text-xs ${actif ? "text-white/60" : "text-slate-400"}`}>{formatDateCourte(conv.updatedAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Zone de chat — style ChatGPT */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header chat */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white"><Bug className="h-4 w-4" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Assistant FixBug</p>
              <p className="text-xs text-slate-500">Signalez un bug par message, avec captures si besoin</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En ligne
          </span>
        </div>
        <ScrollArea className="min-h-0 flex-1 bg-[#FCFCF9]">
          <div className="flex flex-col gap-4 p-4 sm:p-5 max-w-3xl mx-auto w-full">
            {conversationActiveId === null && messages.length === 0 && !chargementConversation ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#12151F]">
                  <Bug className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-[#12151F]">Bonjour !</p>
                <p className="max-w-xs text-sm text-slate-500">
                  Décrivez un problème rencontré, ou choisissez "Nouveau chat" pour démarrer une conversation.
                </p>
              </div>
            ) : chargementConversation ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-2/3 rounded-2xl" />)
            ) : (
              messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#12151F] px-4 py-3">
                      <p className="whitespace-pre-wrap text-sm text-white">{msg.contenu}</p>
                      {msg.captures && msg.captures.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.captures.map((url, j) => (
                            <a key={j} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-white/10">
                              <img
                                src={url}
                                alt="Capture d'écran"
                                crossOrigin="anonymous"
                                className="h-20 w-28 object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mt-1.5 text-right text-[11px] text-white/40">{formatHeure(msg.createdAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-end gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12151F]">
                      <Bug className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-50 px-4 py-3">
                      <p className="mb-1 text-xs font-medium text-slate-400">Assistant Fixbug</p>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        {msg.contenu === "Analyse en cours..." && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" />}
                        <span>{msg.contenu}</span>
                      </div>
                      {msg.bugStatut && (() => {
                        const s = configStatut[msg.bugStatut]; const Icone = s.icone;
                        return (
                          <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.classe}`}>
                            <Icone className="h-3 w-3" /> {s.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ),
              )
            )}
            <div ref={finRef} />
          </div>
        </ScrollArea>

        {/* Saisie — toujours visible */}
        <form onSubmit={(e) => { e.preventDefault(); envoyerMessage(); }} className="shrink-0 border-t border-slate-100 p-3">
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
              ref={textareaRef}
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={1}
              disabled={enAttente}
              className="max-h-32 flex-1 resize-none border-none bg-transparent py-2 text-sm outline-none disabled:opacity-60"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerMessage(); } }}
            />
            <Button type="submit" disabled={enAttente || !saisie.trim()} className="h-9 w-9 shrink-0 rounded-full bg-[#12151F] p-0 hover:bg-[#12151F]/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}