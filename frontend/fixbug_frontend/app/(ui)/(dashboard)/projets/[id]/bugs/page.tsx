"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Clock, CheckCircle2, XCircle, UserCheck, ArrowRight, Bug, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

type BugItem = {
  id: number;
  titre: string | null;
  description: string;
  captures: string[];
  statut: string;
  createdAt: string;
  projetId: number;
  testeur: { id?: number; nom: string; prenom: string };
  developpeur: { id: number; nom: string; prenom: string } | null;
};

const configStatut: Record<string, { label: string; icone: React.ElementType; classe: string }> = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700" },
  EN_ATTENTE_VALIDATION: { label: "En attente de validation", icone: AlertCircle, classe: "bg-amber-50 text-amber-700" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700" },
  RESOLU: { label: "Résolu", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700" },
};

export default function ProjetBugsPage() {
  const params = useParams();
  const router = useRouter();
  const { utilisateur } = useAuth();
  
  const [bugs, setBugs] = useState<BugItem[] | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [bugDeplie, setBugDeplie] = useState<number | null>(null);

  const projetId = params.id;

  const chargerBugs = useCallback(() => {
    // Appel API filtré directement sur le projet courant
    apiFetch(`/bugs?projetId=${projetId}`)
      .then((data: BugItem[]) => setBugs(data))
      .catch(() => setBugs([]));
  }, [projetId]);

  useEffect(() => {
    if (projetId) {
      chargerBugs();
    }
  }, [projetId, chargerBugs]);

  const estDeveloppeur = utilisateur?.role === "DEVELOPPEUR";

  async function handlePrendreEnCharge(bugId: number) {
    setEnCours(bugId);
    try {
      await apiFetch(`/bugs/${bugId}/prendre-en-charge`, { method: "PATCH" });
      toast.success("Bug pris en charge — direction votre espace de travail");
      router.push(`/bugs/${bugId}/espace-travail`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la prise en charge");
      chargerBugs();
    } finally {
      setEnCours(null);
    }
  }

  if (bugs === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      {bugs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Bug className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 font-medium text-slate-700">Aucun bug sur ce projet</p>
          <p className="text-xs text-slate-400">Aucun dysfonctionnement n'a été signalé pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
          {bugs.map((bug) => {
            const statut = configStatut[bug.statut] || {
              label: bug.statut,
              icone: Clock,
              classe: "bg-slate-100 text-slate-700",
            };
            const Icone = statut.icone;
            const estPrisParMoi = bug.developpeur?.id === utilisateur?.id;
            const estDeplie = bugDeplie === bug.id;

            return (
              <div key={bug.id} className="transition hover:bg-slate-50/40">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <button
                    onClick={() => setBugDeplie(estDeplie ? null : bug.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${estDeplie ? "rotate-180" : ""}`} />
                    <div>
                      <p className="font-medium text-[#12151F]">{bug.titre || "Sans titre"}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Signalé par {bug.testeur.prenom} {bug.testeur.nom} · {new Date(bug.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {bug.developpeur && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-brand-ink">
                          <strong><UserCheck className="h-3 w-3" /> Pris en charge par {bug.developpeur.prenom} {bug.developpeur.nom}
                        </strong></p>
                      )}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={`gap-1.5 font-normal ${statut.classe}`}>
                      <Icone className="h-3.5 w-3.5" />
                      {statut.label}
                    </Badge>

                    {estDeveloppeur && !bug.developpeur && (
                      <Button
                        size="sm"
                        disabled={enCours === bug.id}
                        onClick={() => handlePrendreEnCharge(bug.id)}
                        className="bg-[#12151F] hover:bg-[#12151F]/90"
                      >
                        {enCours === bug.id ? "..." : "Prendre en charge"}
                      </Button>
                    )}

                    {estDeveloppeur && estPrisParMoi && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/bugs/${bug.id}/espace-travail`)}
                        className="bg-[#12151F] hover:bg-[#12151F]/90"
                      >
                        Traiter <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Détails du bug */}
                {estDeplie && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                    <p className="mb-3 text-sm leading-relaxed text-slate-600">{bug.description}</p>
                    {bug.captures && bug.captures.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {bug.captures.map((url, j) => (
                          <a
                            key={j}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-lg border border-slate-200"
                          >
                            <img
                              src={url}
                              alt={`Capture ${j + 1}`}
                              className="h-20 w-28 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Aucune capture jointe.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}