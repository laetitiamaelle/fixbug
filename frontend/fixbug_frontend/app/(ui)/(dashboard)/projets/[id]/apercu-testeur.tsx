"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Send, Paperclip, X, Bug, Clock, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

// Statuts possibles d'un bug, avec label + icône + couleur — utilisés pour
// que le testeur voie IMMÉDIATEMENT si son bug est corrigé ou non, sans jargon.
const configStatut = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700 border-blue-200" },
  EN_ATTENTE_VALIDATION: { label: "Correction en cours de vérification", icone: AlertCircle, classe: "bg-amber-50 text-amber-700 border-amber-200" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700 border-red-200" },
  RESOLU: { label: "Corrigé ✓", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700 border-emerald-200" },
} as const;
type Statut = keyof typeof configStatut;

// Un message de chat peut être : un message libre de l'utilisateur, une
// réponse conversationnelle de l'IA, OU la confirmation qu'un bug a été créé
// (avec son statut, affiché en direct — pas besoin de changer de fil).
type Message = {
  key: string;
  role: "user" | "assistant";
  contenu: string;
  captures?: string[]; // captures jointes par l'utilisateur (preview locale ou URL finale)
  bugId?: number;
  bugTitre?: string;
  bugStatut?: Statut;
  pending?: boolean; // "en cours d'envoi" ou "l'IA réfléchit"
  echec?: boolean;
};

const formatHeure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function ApercuTesteur() {
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      key: "accueil",
      role: "assistant",
      contenu: "Bonjour ! Je suis là pour vous aider à signaler un problème. Décrivez ce que vous rencontrez, et joignez une capture d'écran si possible.",
    },
  ]);
  const [saisie, setSaisie] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [enAttente, setEnAttente] = useState(false); // true pendant que l'IA "réfléchit"
  const finRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // NOUVEAU : rafraîchit les statuts des bugs déjà déclarés toutes les 15s,
  // pour que le testeur voie "Corrigé ✓" apparaître sans recharger la page.
  useEffect(() => {
    const idsBugs = messages.filter((m) => m.bugId).map((m) => m.bugId!);
    if (idsBugs.length === 0) return;

    const intervalle = setInterval(async () => {
      try {
        const bugsAJour = await apiFetch(`/bugs?projetId=${params.id}`);
        setMessages((prev) =>
          prev.map((m) => {
            if (!m.bugId) return m;
            const bugAJour = bugsAJour.find((b: any) => b.id === m.bugId);
            return bugAJour ? { ...m, bugStatut: bugAJour.statut } : m;
          }),
        );
      } catch {
        // silencieux : un échec de rafraîchissement périodique n'est pas bloquant
      }
    }, 15000);

    return () => clearInterval(intervalle);
  }, [messages, params.id]);

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

  // Construit l'historique au format attendu par le backend (juste role + contenu,
  // sans les métadonnées d'affichage comme les URLs de captures ou les statuts).
  function construireHistorique(): { role: "user" | "assistant"; contenu: string }[] {
    return messages
      .filter((m) => m.key !== "accueil") // le message d'accueil n'a pas besoin d'être renvoyé à l'IA
      .map((m) => ({ role: m.role, contenu: m.contenu || (m.bugTitre ? `Bug déclaré : ${m.bugTitre}` : "") }));
  }

  async function envoyerMessage() {
    if (!saisie.trim() || enAttente) return;

    const texte = saisie;
    const fichiersEnvoyes = [...fichiers];
    const previewsLocales = fichiersEnvoyes.map((f) => URL.createObjectURL(f));
    const historiqueAvantEnvoi = construireHistorique(); // capturé AVANT d'ajouter le nouveau message

    // 1. Affiche immédiatement le message de l'utilisateur (optimiste)
    const clefUtilisateur = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { key: clefUtilisateur, role: "user", contenu: texte, captures: previewsLocales }]);
    setSaisie("");
    setFichiers([]);

    // 2. Affiche un message "IA en train de réfléchir" — remplacé ensuite par la vraie réponse
    const clefReflexion = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { key: clefReflexion, role: "assistant", contenu: "Analyse en cours...", pending: true }]);
    setEnAttente(true);

    try {
      const formData = new FormData();
      formData.append("projetId", String(params.id));
      formData.append("message", texte);
      formData.append("historique", JSON.stringify(historiqueAvantEnvoi));
      fichiersEnvoyes.forEach((f) => formData.append("captures", f));

      const resultat = await apiFetch("/bugs/chat-testeur", { method: "POST", body: formData });

      if (resultat.type === "bug_declare") {
        // L'IA a jugé bon de déclarer un vrai bug — on affiche sa confirmation,
        // AVEC le statut (coloré) directement visible dans le fil de discussion.
        setMessages((prev) =>
          prev.map((m) =>
            m.key === clefReflexion
              ? {
                  key: clefReflexion,
                  role: "assistant",
                  contenu: `J'ai bien enregistré votre signalement : « ${resultat.bug.titre} ». Un développeur va s'en occuper.`,
                  bugId: resultat.bug.id,
                  bugTitre: resultat.bug.titre,
                  bugStatut: resultat.bug.statut,
                }
              : m,
          ),
        );
        toast.success("Bug déclaré avec succès");
      } else {
        // Réponse conversationnelle simple — pas de bug créé
        setMessages((prev) => prev.map((m) => (m.key === clefReflexion ? { ...m, contenu: resultat.contenu, pending: false } : m)));
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.key === clefReflexion ? { ...m, contenu: "Une erreur est survenue, réessayez.", pending: false, echec: true } : m)),
      );
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEnAttente(false);
    }
  }

  return (
    // Un seul panneau maintenant : plus de colonne "historique des bugs" séparée —
    // tout se passe dans ce fil de conversation continu, comme demandé.
    <div className="mx-auto flex h-[calc(100vh-190px)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-5">
          {messages.map((msg) =>
            msg.role === "user" ? (
              // --- Bulle utilisateur (testeur) ---
              <div key={msg.key} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#12151F] px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm text-white">{msg.contenu}</p>
                  {msg.captures && msg.captures.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.captures.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-white/10">
                          {/* onError : si l'URL est cassée, on affiche un repli visible plutôt qu'une icône cassée silencieuse */}
                          <img
                            src={url}
                            alt=""
                            className="h-20 w-28 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // --- Bulle assistant IA ---
              <div key={msg.key} className="flex items-end gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12151F]">
                  <Bug className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-50 px-4 py-3">
                  <p className="mb-1 text-xs font-medium text-slate-400">Assistant Fixbug</p>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    {msg.pending && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" />}
                    {msg.echec && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                    <span>{msg.contenu}</span>
                  </div>

                  {/* Badge de statut coloré — visible dès qu'un bug est confirmé, mis à jour toutes les 15s */}
                  {msg.bugStatut && (() => {
                    const s = configStatut[msg.bugStatut];
                    const Icone = s.icone;
                    return (
                      <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.classe}`}>
                        <Icone className="h-3 w-3" /> {s.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ),
          )}
          <div ref={finRef} />
        </div>
      </ScrollArea>

      {/* Barre de saisie — TOUJOURS visible maintenant, plus de condition sur "nouveau" */}
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
  );
}