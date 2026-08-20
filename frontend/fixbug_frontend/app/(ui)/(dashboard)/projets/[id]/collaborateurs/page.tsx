"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    Search,
    UserPlus,
    X,
    Trash2,
    Clock,
    Loader2,
    UserRound,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";


type Utilisateur = { id: number; nom: string; prenom: string; email: string; role?: string };
type Collaboration = { utilisateur: Utilisateur };
type InvitationEnAttente = { id: number; utilisateur: Utilisateur };


const configRole: Record<string, { label: string; classe: string }> = {
    DEVELOPPEUR: { label: "Developpeur", classe: "bg-green-50 text-green-700" },
    TESTEUR: { label: "Testeur", classe: "bg-blue-100 text-blue-600" },
};

function libelleRole(role?: string) {
    if (!role) return null;
    return configRole[role] ?? { label: role, classe: "bg-slate-100 text-slate-600" };
}

/* ------------------------------------------------------------------ */
/* Badge de rôle                                                       */
/* ------------------------------------------------------------------ */
function BadgeRole({ role }: { role?: string }) {
    const infos = libelleRole(role);
    if (!infos) return null;
    return (
        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${infos.classe}`}>
            {infos.label}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Avatar : cercle avec initiales, comme le fallback GitHub            */
/* ------------------------------------------------------------------ */
function Avatar({ prenom, nom, size = 32 }: { prenom: string; nom: string; size?: number }) {
    const initiales = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
    return (
        <span
            className="flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-medium text-slate-600"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {initiales}
        </span>
    );
}

export default function CollaborateursProjetPage() {
    const params = useParams();

    const [collaborateurs, setCollaborateurs] = useState<Collaboration[] | null>(null);
    const [invitations, setInvitations] = useState<InvitationEnAttente[] | null>(null);

    const [modalOuvert, setModalOuvert] = useState(false);
    const [recherche, setRecherche] = useState("");
    const [resultats, setResultats] = useState<Utilisateur[]>([]);
    const [rechercheEnCours, setRechercheEnCours] = useState(false);
    const [selectionnes, setSelectionnes] = useState<Utilisateur[]>([]);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    const chargerTout = useCallback(() => {
        apiFetch(`/collaborations/projets/${params.id}/collaborateurs`).then(setCollaborateurs).catch(() => setCollaborateurs([]));
        apiFetch(`/collaborations/projets/${params.id}/invitations`).then(setInvitations).catch(() => setInvitations([]));
    }, [params.id]);

    useEffect(() => { chargerTout(); }, [chargerTout]);

    useEffect(() => {
        if (recherche.trim().length < 2) { setResultats([]); return; }
        setRechercheEnCours(true);
        const delai = setTimeout(() => {
            apiFetch(`/users/projets/${params.id}/rechercher-testeur?q=${encodeURIComponent(recherche)}`)
                .then((data: Utilisateur[]) => {
                    const exclusIds = new Set([
                        ...(collaborateurs ?? []).map((c) => c.utilisateur.id),
                        ...(invitations ?? []).map((i) => i.utilisateur.id),
                        ...selectionnes.map((s) => s.id),
                    ]);
                    setResultats(data.filter((u) => !exclusIds.has(u.id)));
                })
                .catch(() => setResultats([]))
                .finally(() => setRechercheEnCours(false));
        }, 300);
        return () => clearTimeout(delai);
    }, [recherche, params.id, collaborateurs, invitations, selectionnes]);

    function ouvrirModal() {
        setSelectionnes([]);
        setRecherche("");
        setResultats([]);
        setModalOuvert(true);
    }

    function ajouterALaSelection(u: Utilisateur) {
        setSelectionnes((prev) => [...prev, u]);
        setRecherche("");
        setResultats([]);
    }

    function retirerDeLaSelection(id: number) {
        setSelectionnes((prev) => prev.filter((u) => u.id !== id));
    }

    async function handleConfirmerAjout() {
        if (selectionnes.length === 0) return;
        setEnvoiEnCours(true);
        const resultatsEnvoi = await Promise.allSettled(
            selectionnes.map((u) =>
                apiFetch(`/collaborations/projets/${params.id}/collaborateurs`, {
                    method: "POST",
                    body: JSON.stringify({ utilisateurId: u.id }),
                })
            )
        );
        const succes = resultatsEnvoi.filter((r) => r.status === "fulfilled").length;
        const echecs = resultatsEnvoi.length - succes;

        if (succes > 0) {
            toast.success(
                succes === 1
                    ? `Invitation envoyée à ${selectionnes[0].prenom} ${selectionnes[0].nom}`
                    : `${succes} invitations envoyées`
            );
        }
        if (echecs > 0) {
            toast.error(`${echecs} invitation${echecs > 1 ? "s" : ""} n'${echecs > 1 ? "ont" : "a"} pas pu être envoyée${echecs > 1 ? "s" : ""}`);
        }

        setEnvoiEnCours(false);
        setModalOuvert(false);
        setSelectionnes([]);
        chargerTout();
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Collaborateur du projet</h2>
                {!listeVide && !chargement && (
                    <Button size="sm" onClick={ouvrirModal} className="bg-[#12151F] hover:bg-[#12151F]/90">
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Ajouter des collaborateur
                    </Button>
                )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {chargement ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="border-b border-slate-100 p-4 last:border-0">
                            <Skeleton className="h-4 w-40" />
                        </div>
                    ))
                ) : listeVide ? (
                    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                            <UserRound className="h-6 w-6 text-blue-500" strokeWidth={1.75} />
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white">
                                <Lock className="h-3.5 w-3.5 text-blue-500" strokeWidth={2} />
                            </span>
                        </span>
                        <p className="text-base font-medium text-slate-700">
                            Vous n'avez invité aucun collaborateur pour l'instant
                        </p>
                        <Button
                            variant="outline"
                            onClick={ouvrirModal}
                            className="border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"
                        >
                            Ajouter des collaborateur
                        </Button>
                    </div>
                ) : (
                    <>
                        {collaborateurs!.map((c) => (
                            <div
                                key={`collab-${c.utilisateur.id}`}
                                className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar prenom={c.utilisateur.prenom} nom={c.utilisateur.nom} />
                                    <div>
                                        <p className="font-medium text-[#12151F]">{c.utilisateur.prenom} {c.utilisateur.nom}</p>
                                        <p className="text-sm text-slate-500">{c.utilisateur.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BadgeRole role={c.utilisateur.role} />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRetirer(c.utilisateur)}
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <X className="mr-1 h-4 w-4" /> Retirer
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {invitations!.map((inv) => (
                            <div
                                key={`invit-${inv.id}`}
                                className="flex items-center justify-between border-b border-slate-100 bg-amber-50/30 px-5 py-3.5 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar prenom={inv.utilisateur.prenom} nom={inv.utilisateur.nom} />
                                    <div>
                                        <p className="font-medium text-[#12151F]">{inv.utilisateur.prenom} {inv.utilisateur.nom}</p>
                                        <p className="text-sm text-slate-500">{inv.utilisateur.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BadgeRole role={inv.utilisateur.role} />
                                    <Badge className="gap-1 bg-amber-100 font-normal text-amber-700">
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

            {/* Modale "Add people to <projet>", façon GitHub */}
            <Dialog open={modalOuvert} onOpenChange={(open) => { setModalOuvert(open); if (!open) { setSelectionnes([]); setRecherche(""); setResultats([]); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-base">Ajouter des personnes au projet</DialogTitle>
                    </DialogHeader>

                    <div className="mt-1">
                        <p className="mb-2 text-center text-sm text-slate-600">
                            Recherchez par nom, prénom ou email
                        </p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                autoFocus
                                placeholder="Rechercher une personne"
                                className="pl-9 pr-9 focus-visible:border-blue-500 focus-visible:ring-blue-100"
                                value={recherche}
                                onChange={(e) => setRecherche(e.target.value)}
                            />
                            {rechercheEnCours && (
                                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                            )}
                        </div>

                        {resultats.length > 0 && (
                            <div className="mt-2 max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
                                {resultats.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => ajouterALaSelection(u)}
                                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar prenom={u.prenom} nom={u.nom} size={28} />
                                            <div>
                                                <p className="text-sm font-medium text-[#12151F]">{u.prenom} {u.nom}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                        <BadgeRole role={u.role} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectionnes.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectionnes.map((u) => (
                                    <span
                                        key={u.id}
                                        className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-2 text-sm text-slate-800"
                                    >
                                        <Avatar prenom={u.prenom} nom={u.nom} size={20} />
                                        {u.prenom} {u.nom}
                                        {u.role && (
                                            <span className="text-xs text-slate-500">
                                                · {libelleRole(u.role)?.label}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => retirerDeLaSelection(u.id)}
                                            className="ml-0.5 text-slate-400 hover:text-slate-700"
                                            aria-label={`Retirer ${u.prenom} ${u.nom}`}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setModalOuvert(false)}>
                            Annuler
                        </Button>
                        <Button
                            disabled={selectionnes.length === 0 || envoiEnCours}
                            onClick={handleConfirmerAjout}
                            className="bg-[#2da44e] text-white hover:bg-[#2c974b] disabled:opacity-50"
                        >
                            {envoiEnCours ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Envoi...
                                </>
                            ) : (
                                "Ajouter au projet"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}