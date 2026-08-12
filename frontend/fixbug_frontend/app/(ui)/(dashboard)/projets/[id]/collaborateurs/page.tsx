"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Search, UserPlus, X, Trash2, Users2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Utilisateur = { id: number; nom: string; prenom: string; email: string };
type Collaboration = { utilisateur: Utilisateur };
type InvitationEnAttente = { id: number; utilisateur: Utilisateur };

export default function CollaborateursProjetPage() {
  const params = useParams();
  const [collaborateurs, setCollaborateurs] = useState<Collaboration[] | null>(null);
  const [invitations, setInvitations] = useState<InvitationEnAttente[] | null>(null);
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<Utilisateur[]>([]);
  const [enCours, setEnCours] = useState<number | null>(null);

  const chargerTout = useCallback(() => {
    apiFetch(`/collaborations/projets/${params.id}/collaborateurs`).then(setCollaborateurs).catch(() => setCollaborateurs([]));
    apiFetch(`/collaborations/projets/${params.id}/invitations`).then(setInvitations).catch(() => setInvitations([]));
  }, [params.id]);

  useEffect(() => { chargerTout(); }, [chargerTout]);

  useEffect(() => {
    if (recherche.trim().length < 2) { setResultats([]); return; }
    const delai = setTimeout(() => {
      apiFetch(`/users/projets/${params.id}/rechercher-testeur?q=${encodeURIComponent(recherche)}`)
        .then(setResultats).catch(() => setResultats([]));
    }, 300);
    return () => clearTimeout(delai);
  }, [recherche, params.id]);

  async function handleInviter(u: Utilisateur) {
    setEnCours(u.id);
    try {
      await apiFetch(`/collaborations/projets/${params.id}/collaborateurs`, {
        method: "POST",
        body: JSON.stringify({ utilisateurId: u.id }),
      });
      toast.success(`Invitation envoyée à ${u.prenom} ${u.nom}`);
      setRecherche("");
      setResultats([]);
      chargerTout(); // l'invitation apparaît maintenant "En attente" dans la liste ci-dessous
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'invitation");
    } finally {
      setEnCours(null);
    }
  }

  async function handleRetirer(u: Utilisateur) {
    try {
      await apiFetch(`/collaborations/projets/${params.id}/collaborateurs/${u.id}`, { method: "DELETE" });
      toast.success(`${u.prenom} ${u.nom} a été retiré du projet`);
      chargerTout();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du retrait");
    }
  }

  async function handleAnnulerInvitation(invitationId: number, u: Utilisateur) {
    try {
      await apiFetch(`/collaborations/projets/${params.id}/invitations/${invitationId}`, { method: "DELETE" });
      toast.success(`Invitation annulée pour ${u.prenom} ${u.nom}`);
      chargerTout();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    }
  }

  const chargement = collaborateurs === null || invitations === null;
  const listeVide = !chargement && collaborateurs!.length === 0 && invitations!.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-[#12151F]">Inviter un collaborateur</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Rechercher un testeur par nom ou email..." className="pl-9" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </div>
        {resultats.length > 0 && (
          <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
            {resultats.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-[#12151F]">{u.prenom} {u.nom}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <Button size="sm" disabled={enCours === u.id} onClick={() => handleInviter(u)} className="bg-[#12151F] hover:bg-[#12151F]/90">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> {enCours === u.id ? "Envoi..." : "Inviter"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-[#12151F]">Accès au projet</h2>
        </div>

        {chargement ? (
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="border-b border-slate-100 p-4 last:border-0"><Skeleton className="h-4 w-40" /></div>)
        ) : listeVide ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><Users2 size={20} className="text-slate-400" /></div>
            <p className="text-sm text-slate-500">Aucun collaborateur pour l&apos;instant.</p>
          </div>
        ) : (
          <>
            {/* Collaborateurs déjà actifs */}
            {collaborateurs!.map((c) => (
              <div key={`collab-${c.utilisateur.id}`} className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 last:border-0">
                <div>
                  <p className="font-medium text-[#12151F]">{c.utilisateur.prenom} {c.utilisateur.nom}</p>
                  <p className="text-sm text-slate-500">{c.utilisateur.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRetirer(c.utilisateur)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <X className="mr-1 h-4 w-4" /> Retirer
                </Button>
              </div>
            ))}

            {/* NOUVEAU : invitations en attente, avec badge + bouton annuler (façon GitHub "Pending Invite") */}
            {invitations!.map((inv) => (
              <div key={`invit-${inv.id}`} className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 last:border-0 bg-amber-50/30">
                <div>
                  <p className="font-medium text-[#12151F]">{inv.utilisateur.prenom} {inv.utilisateur.nom}</p>
                  <p className="text-sm text-slate-500">{inv.utilisateur.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="gap-1 bg-amber-100 text-amber-700 font-normal">
                    <Clock className="h-3 w-3" /> En attente
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAnnulerInvitation(inv.id, inv.utilisateur)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}