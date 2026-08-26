"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Check, X, FolderGit2, UserRoundPlus, Clock, Search, Inbox, GitPullRequest } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner"
import Link from "next/link";

type Invitation = {
  id: number;
  dateEnvoie: string;
  projet: { id: number; nom: string; description: string | null };
};

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [enTraitement, setEnTraitement] = useState<number | null>(null);
  const [recherche, setRecherche] = useState("");

  const chargerInvitations = useCallback(() => {
    apiFetch("/collaborations/invitations").then(setInvitations).catch(() => setInvitations([]));
  }, []);

  useEffect(() => { chargerInvitations(); }, [chargerInvitations]);

  async function handleAccepter(id: number) {
  setEnTraitement(id);
  try {
    await apiFetch(`/collaborations/invitations/${id}/accepterinvitation`, { method: "PATCH" });
    toast.success("Invitation acceptée — vous avez maintenant accès au projet");
    chargerInvitations();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Erreur lors de l'acceptation");
  } finally {
    setEnTraitement(null);
  }
}

async function handleRefuser(id: number) {
  setEnTraitement(id);
  try {
    await apiFetch(`/collaborations/invitations/${id}/refuserinvitation`, { method: "PATCH" });
    toast.success("Invitation refusée");
    chargerInvitations();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Erreur lors du refus");
  } finally {
    setEnTraitement(null);
  }
}

  const filtrees = invitations?.filter(inv => 
    !recherche || inv.projet.nom.toLowerCase().includes(recherche.toLowerCase())
  ) ?? null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header façon GitHub */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12151F] text-white">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#12151F]">Invitations</h1>
            <p className="text-sm text-slate-500">Gérez vos invitations à collaborer — comme sur GitHub.</p>
          </div>
          {invitations && invitations.length > 0 && (
            <Badge variant="secondary" className="ml-auto hidden sm:inline-flex bg-slate-100 text-slate-700 border-slate-200">
              {invitations.length} en attente
            </Badge>
          )}
        </div>

        {/* Barre d'outils GitHub-like */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Filtrer les invitations..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-9 h-8 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {filtrees ? `${filtrees.length} invitation${filtrees.length !== 1 ? "s" : ""}` : "Chargement..."}
            </span>
          </div>
        </div>
      </div>

      {/* Liste façon GitHub */}
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
        {/* En-tête de liste GitHub */}
        <div className="flex items-center justify-between bg-slate-50 border-b border-slate-300 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Inbox className="h-4 w-4 text-slate-500" />
            Invitations reçues
          </div>
          <span className="text-xs text-slate-500">{filtrees?.length ?? 0} ouvertes</span>
        </div>

        {filtrees === null ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 border-b border-slate-200 p-4 last:border-0">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-64" /></div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))
        ) : filtrees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
              <GitPullRequest className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{recherche ? "Aucun résultat" : "Aucune invitation en attente"}</p>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                {recherche ? `Aucune invitation ne correspond à "${recherche}".` : "Quand un chef de projet vous invitera à un dépôt, vous la verrez ici. En attendant, tout est à jour."}
              </p>
            </div>
            {recherche ? (
              <Button variant="outline" size="sm" onClick={() => setRecherche("")} className="mt-2">Effacer le filtre</Button>
            ) : (
              <Link href="/projets" className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4">
                Parcourir vos projets →
              </Link>
            )}
          </div>
        ) : (
          filtrees.map((invitation, i) => (
            <div
              key={invitation.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 hover:bg-slate-50 transition-colors ${
                i !== filtrees.length - 1 ? "border-b border-slate-200" : ""
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white mt-0.5">
                  <UserRoundPlus className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight text-slate-900">
                    <span className="text-slate-500">Vous êtes invité à rejoindre</span>{" "}
                    <span className="font-semibold text-[#12151F] inline-flex items-center gap-1.5">
                      <FolderGit2 className="h-3.5 w-3.5 text-slate-500" />
                      {invitation.projet.nom}
                    </span>
                  </p>
                  {invitation.projet.description && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">{invitation.projet.description}</p>
                  )}
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    Invité le {new Date(invitation.dateEnvoie).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">En attente</span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2 self-end sm:self-center ml-11 sm:ml-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enTraitement === invitation.id}
                  onClick={() => handleRefuser(invitation.id)}
                  className="h-7 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Décliner
                </Button>
                <Button
                  size="sm"
                  disabled={enTraitement === invitation.id}
                  onClick={() => handleAccepter(invitation.id)}
                  className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Accepter
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Astuce GitHub : acceptez l’invitation pour apparaître dans <span className="font-medium text-slate-600">Projets → Collaborations</span>.
      </p>
    </div>
  );
}
