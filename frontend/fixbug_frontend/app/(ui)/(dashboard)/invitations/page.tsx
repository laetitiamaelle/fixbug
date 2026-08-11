"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Check, X, FolderGit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type Invitation = {
  id: number;
  dateEnvoie: string;
  projet: { id: number; nom: string; description: string | null };
};

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [enTraitement, setEnTraitement] = useState<number | null>(null);

  const chargerInvitations = useCallback(() => {
    apiFetch("/invitations").then(setInvitations).catch(() => setInvitations([]));
  }, []);

  useEffect(() => { chargerInvitations(); }, [chargerInvitations]);

  async function handleAccepter(id: number) {
    setEnTraitement(id);
    try {
      await apiFetch(`/invitations/${id}/accepterinvitation`, { method: "PATCH" });
      chargerInvitations(); 
    } catch (err) {
      console.error(err);
    } finally {
      setEnTraitement(null);
    }
  }

  async function handleRefuser(id: number) {
    setEnTraitement(id);
    try {
      await apiFetch(`/invitations/${id}/refuserinvitation`, { method: "PATCH" });
      chargerInvitations();
    } catch (err) {
      console.error(err);
    } finally {
      setEnTraitement(null);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-ink">Invitations</h1>
      <p className="mb-6 text-sm text-slate-500">Projets auxquels vous avez été invité(e) à collaborer.</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {invitations === null ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 border-b border-slate-100 p-5 last:border-0">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-64" /></div>
            </div>
          ))
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Mail size={20} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Aucune invitation en attente.</p>
          </div>
        ) : (
          invitations.map((invitation, i) => (
            <div
              key={invitation.id}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i !== invitations.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <FolderGit2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-[#12151F]">{invitation.projet.nom}</p>
                  {invitation.projet.description && (
                    <p className="text-sm text-slate-500">{invitation.projet.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    Invité le {new Date(invitation.dateEnvoie).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enTraitement === invitation.id}
                  onClick={() => handleRefuser(invitation.id)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Refuser
                </Button>
                <Button
                  size="sm"
                  disabled={enTraitement === invitation.id}
                  onClick={() => handleAccepter(invitation.id)}
                  className="bg-[#12151F] hover:bg-[#12151F]/90"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Accepter
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}