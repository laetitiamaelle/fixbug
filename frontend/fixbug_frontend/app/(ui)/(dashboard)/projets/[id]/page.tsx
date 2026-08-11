"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, Paperclip, X, Bug, Users, Pencil, Clock, AlertCircle, CheckCircle2, XCircle, ImageIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconeGithub } from "../../../../components/icone-github";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type Projet = {
  id: number;
  nom: string;
  description: string | null;
  lienGithub: string | null;
  technologies: string[];
  estProprietaire: boolean;
  _count?: { bugs: number; collaborateurs: number };
};

type BugMessage = {
  id: number;
  titre: string | null;
  description: string;
  captures: string[];
  statut: "EN_COURS_DE_TRAITEMENT" | "EN_ATTENTE_VALIDATION" | "BLOQUE" | "RESOLU";
  createdAt: string;
  testeur: { id: number; nom: string; prenom: string };
};

const configStatut = {
  EN_COURS_DE_TRAITEMENT: { label: "Analyse en cours...", icone: Clock, classe: "bg-blue-50 text-blue-700" },
  EN_ATTENTE_VALIDATION: { label: "Correction proposée, en attente de validation", icone: AlertCircle, classe: "bg-amber-50 text-amber-700" },
  BLOQUE: { label: "L'agent n'a pas pu traiter ce bug seul", icone: XCircle, classe: "bg-red-50 text-red-700" },
  RESOLU: { label: "Bug résolu ✅", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700" },
};

export default function ApercuProjetPage() {
  const params = useParams();
  const { utilisateur } = useAuth();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [messages, setMessages] = useState<BugMessage[] | null>(null);
  const [description, setDescription] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const finDesMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch(`/projets/${params.id}`).then(setProjet).catch(() => setProjet(null));
  }, [params.id]);

  function chargerMessages() {
    apiFetch(`/bugs?projetId=${params.id}`).then(setMessages).catch(() => setMessages([]));
  }

  useEffect(() => { chargerMessages(); }, [params.id]);

  useEffect(() => {
    finDesMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleAjoutFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFichiers([...fichiers, ...Array.from(e.target.files)]);
  }

  async function handleEnvoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setEnvoi(true);
    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("projetId", String(params.id));
      fichiers.forEach((f) => formData.append("captures", f));

      await apiFetch("/bugs", { method: "POST", body: formData });
      setDescription("");
      setFichiers([]);
      chargerMessages(); // recharge la conversation pour afficher le nouveau message
    } catch (err) {
      console.error(err);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      {/* Fenêtre de chat */}
      <div className="flex h-[calc(100vh-220px)] flex-col rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-[#12151F]">Agent IA — Fixbug</h2>
          <p className="text-sm text-slate-500">Décrivez un bug, l&apos;agent l&apos;analyse et propose une correction.</p>
        </div>

        {/* Fil de conversation */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages === null ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="ml-auto h-16 w-2/3" />)
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
              <Bug className="h-8 w-8" />
              <p className="text-sm">Aucun bug signalé pour l&apos;instant. Décrivez-en un ci-dessous.</p>
            </div>
          ) : (
            messages.map((msg) => <MessageBug key={msg.id} message={msg} estMoi={msg.testeur.id === utilisateur?.id} />)
          )}
          <div ref={finDesMessages} />
        </div>

        {/* Composeur */}
        <form onSubmit={handleEnvoyer} className="border-t border-slate-200 p-4">
          {fichiers.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
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
          <div className="flex items-end gap-2">
            <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Paperclip className="h-4 w-4" />
              <input type="file" accept="image/*" multiple onChange={handleAjoutFichiers} className="hidden" />
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le bug rencontré..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnvoyer(e); }
              }}
            />
            <Button type="submit" disabled={envoi || !description.trim()} className="h-10 w-10 shrink-0 bg-[#12151F] p-0 hover:bg-[#12151F]/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Panneau About */}
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-[#12151F]">À propos</h3>
          {projet?.description && <p className="mb-4 text-sm text-slate-600">{projet.description}</p>}
          {projet?.lienGithub && (
            <a href={projet.lienGithub} target="_blank" rel="noreferrer" className="mb-4 flex items-center gap-2 text-sm text-slate-600 hover:text-[#12151F]">
              <IconeGithub className="h-4 w-4" /><span className="truncate">Dépôt GitHub</span>
            </a>
          )}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {projet?.technologies.map((tech) => <Badge key={tech} variant="secondary" className="font-normal">{tech}</Badge>)}
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
            <div className="flex items-center gap-2"><Bug className="h-4 w-4 text-slate-400" /> {projet?._count?.bugs ?? 0} bug(s)</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" /> {projet?._count?.collaborateurs ?? 0} collaborateur(s)</div>
          </div>
        </div>

        {/* N'affiche ce bloc que si l'utilisateur connecté est le chef de ce projet précis */}
        {projet?.estProprietaire && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <Link href="./parametres" className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}>
              <Pencil className="mr-2 h-4 w-4" /> Modifier le projet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBug({ message, estMoi }: { message: BugMessage; estMoi: boolean }) {
  const statut = configStatut[message.statut];
  const Icone = statut.icone;

  return (
    <div className={`flex ${estMoi ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] space-y-2`}>
        {/* Bulle du testeur : description + éventuelles captures */}
        <div className={`rounded-2xl px-4 py-2.5 ${estMoi ? "rounded-br-sm bg-[#12151F] text-white" : "rounded-bl-sm bg-slate-100 text-[#12151F]"}`}>
          <p className="text-sm">{message.description}</p>
          {message.captures.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.captures.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs">
                  <ImageIcon className="h-3 w-3" /> Capture {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
        {/* "Réponse" système reflétant le statut actuel du traitement */}
        <div className={`flex items-center gap-1.5 text-xs text-slate-500 ${estMoi ? "justify-end" : "justify-start"}`}>
          <Icone className="h-3 w-3" />
          <span className={`rounded px-1.5 py-0.5 ${statut.classe}`}>{statut.label}</span>
          <span>· {new Date(message.createdAt).toLocaleString("fr-FR")}</span>
        </div>
      </div>
    </div>
  );
}