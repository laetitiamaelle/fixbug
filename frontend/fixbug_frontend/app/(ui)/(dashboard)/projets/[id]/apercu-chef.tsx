// apercu-chef-dev.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users2, Bug, Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

type ApercuProjet = {
  nombreMembres: number;
  nombreTesteurs: number;
  nombreDeveloppeurs: number;
  bugs: {
    total: number;
    enCoursDeTraitement: number;
    enAttenteValidation: number;
    bloque: number;
    resolu: number;
  };
};

export default function ApercuChef() {
  const params = useParams();
  const [apercu, setApercu] = useState<ApercuProjet | null>(null);

 useEffect(() => {
  apiFetch(`/projets/${params.id}/apercu`)
    .then((data) => {
      console.log('Aperçu reçu :', data);
      setApercu(data);
    })
    .catch((err) => {
      console.error('Erreur apercu :', err); // ← NOUVEAU, temporaire
      setApercu(null);
    });
}, [params.id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <CarteStat titre="Membres" valeur={apercu?.nombreMembres} icone={Users2} />
        <CarteStat titre="Testeurs" valeur={apercu?.nombreTesteurs} icone={Users2} />
        <CarteStat titre="Développeurs" valeur={apercu?.nombreDeveloppeurs} icone={Users2} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#12151F]">Bugs du projet</h2>
          <Link href={`/projets/${params.id}/bugs`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#12151F]">
            Voir tous les bugs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <CarteStat titre="En traitement" valeur={apercu?.bugs.enCoursDeTraitement} icone={Clock} couleur="text-blue-600" />
          <CarteStat titre="En attente de validation" valeur={apercu?.bugs.enAttenteValidation} icone={AlertCircle} couleur="text-amber-600" />
          <CarteStat titre="Bloqués" valeur={apercu?.bugs.bloque} icone={XCircle} couleur="text-red-600" />
          <CarteStat titre="Résolus" valeur={apercu?.bugs.resolu} icone={CheckCircle2} couleur="text-emerald-600" />
        </div>
      </div>
    </div>
  );
}

function CarteStat({ titre, valeur, icone: Icone, couleur = "text-[#12151F]" }: { titre: string; valeur?: number; icone: React.ElementType; couleur?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Icone className="h-3.5 w-3.5" /> {titre}
      </div>
      {valeur === undefined ? <Skeleton className="h-7 w-10" /> : <p className={`text-2xl font-bold ${couleur}`}>{valeur}</p>}
    </div>
  );
}