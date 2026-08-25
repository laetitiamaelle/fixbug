"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Clock, CheckCircle2, XCircle, UserCheck, ArrowRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type BugItem = {
  id: number; titre: string | null; description: string; captures: string[]; statut: string; createdAt: string; projetId: number;
  testeur: { nom: string; prenom: string };
  developpeur: { id: number; nom: string; prenom: string } | null;
  projet: { nom: string };
};


const configStatut: Record<string, { label: string; icone: React.ElementType; classe: string }> = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700" },
  EN_ATTENTE_VALIDATION: { label: "En attente de validation", icone: AlertCircle, classe: "bg-amber-50 text-amber-700" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700" },
  RESOLU: { label: "Résolu", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700" },
};

export default function TousLesBugsPage() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [bugs, setBugs] = useState<BugItem[] | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [bugDeplie, setBugDeplie] = useState<number | null>(null); 

  const chargerBugs = useCallback(() => {
    apiFetch("/bugs").then(setBugs).catch(() => setBugs([]));
  }, []);

  useEffect(() => { chargerBugs(); }, [chargerBugs]);

  const estDeveloppeur = utilisateur?.role === "DEVELOPPEUR";

  async function handlePrendreEnCharge(bugId: number) {
    setEnCours(bugId);
    try {
      await apiFetch(`/bugs/${bugId}/prendre-en-charge`, { method: "PATCH" });
      toast.success("Bug pris en charge — direction votre espace de travail");
      router.push(`/bugs/${bugId}/espace-travail`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ce bug a déjà été pris en charge par quelqu'un d'autre");
      chargerBugs(); // recharge pour refléter l'état réel
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#12151F]">
        {estDeveloppeur ? "Bugs à traiter" : "Suivi des bugs"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {estDeveloppeur
          ? "Prenez en charge un bug pour commencer à le corriger."
          : "Tous les bugs signalés sur vos projets."}
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
         {bugs?.map((bug, i) => {
          const statut = configStatut[bug.statut];
          const Icone = statut.icone;
          const estPrisParMoi = bug.developpeur?.id === utilisateur?.id;
          const estDeplie = bugDeplie === bug.id; // NOUVEAU

          return (
            <div key={bug.id} className={i !== bugs.length - 1 ? "border-b border-slate-200" : ""}>
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <button
                  onClick={() => setBugDeplie(estDeplie ? null : bug.id)} // NOUVEAU : toggle
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${estDeplie ? "rotate-180" : ""}`} />
                  <div>
                    <p className="font-medium text-[#12151F]">{bug.titre || "Sans titre"}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {bug.projet.nom} · {bug.testeur.prenom} {bug.testeur.nom} · {new Date(bug.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    {bug.developpeur && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <UserCheck className="h-3 w-3" /> Pris en charge par {bug.developpeur.prenom} {bug.developpeur.nom}
                      </p>
                    )}
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={`gap-1.5 font-normal ${statut.classe}`}>
                    <Icone className="h-3.5 w-3.5" />{statut.label}
                  </Badge>
                  {utilisateur?.role === "DEVELOPPEUR" && !bug.developpeur && (
                    <Button size="sm" disabled={enCours === bug.id} onClick={() => handlePrendreEnCharge(bug.id)} className="bg-[#12151F] hover:bg-[#12151F]/90">
                      {enCours === bug.id ? "..." : "Prendre en charge"}
                    </Button>
                  )}
                  {utilisateur?.role === "DEVELOPPEUR" && estPrisParMoi && (
                    <Button size="sm" onClick={() => router.push(`/bugs/${bug.id}/espace-travail`)} className="bg-[#12151F] hover:bg-[#12151F]/90">
                      Traiter <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* NOUVEAU : panneau déplié — description + captures, visible pour chef de projet ET développeur */}
              {estDeplie && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                  <p className="mb-3 text-sm leading-relaxed text-slate-600">{bug.description}</p>
                  {bug.captures.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {bug.captures.map((url, j) => (
                        <a key={j} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-slate-200">
                          <img
                            src={url}
                            alt={`Capture ${j + 1}`}
                            className="h-20 w-28 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
    </div>
  );
}