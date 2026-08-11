"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

type BugItem = {
  id: number; titre: string | null; statut: string; createdAt: string; projetId: number;
  testeur: { nom: string; prenom: string }; projet: { nom: string };
};

const configStatut: Record<string, { label: string; icone: React.ElementType; classe: string }> = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700" },
  EN_ATTENTE_VALIDATION: { label: "En attente de validation", icone: AlertCircle, classe: "bg-amber-50 text-amber-700" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700" },
  RESOLU: { label: "Résolu", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700" },
};

export default function TousLesBugsPage() {
  const [bugs, setBugs] = useState<BugItem[] | null>(null);

  useEffect(() => { apiFetch("/bugs").then(setBugs).catch(() => setBugs([])); }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#12151F]">Suivi des bugs</h1>
      <p className="mb-6 text-sm text-slate-500">Tous les bugs signalés sur vos projets.</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {bugs === null ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-5"><Skeleton className="h-5 w-full" /></div>)
        ) : bugs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Aucun bug signalé.</p>
        ) : (
          bugs.map((bug, i) => {
            const statut = configStatut[bug.statut];
            const Icone = statut.icone;
            return (
              <Link
                key={bug.id}
                href={`/projets/${bug.projetId}/bugs`}
                className={`flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 ${i !== bugs.length - 1 ? "border-b border-slate-200" : ""}`}
              >
                <div>
                  <p className="font-medium text-[#12151F]">{bug.titre || "Sans titre"}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {bug.projet.nom} · {bug.testeur.prenom} {bug.testeur.nom} · {new Date(bug.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge className={`gap-1.5 font-normal ${statut.classe}`}><Icone className="h-3.5 w-3.5" />{statut.label}</Badge>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}