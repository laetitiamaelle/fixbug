"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Users2, Bug, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

type Stats = {
  nombreProjets: number;
  nombreCollaborateurs: number;
  nombreBugs: number;
  bugsCorriges: number;
  bugsNonCorriges: number;
};

export default function DashboardPage() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (utilisateur && utilisateur.role !== "CHEF_PROJET" ) {
      router.replace("/projets");
    }
  }, [utilisateur, router]);

  useEffect(() => {
    apiFetch("/projets/statistiques").then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/projets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#12151F] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour aux projets
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#12151F]">Bienvenue {utilisateur?.prenom} </h1>
        <p className="mt-1 text-sm text-slate-500">Voici un aperçu de votre activité.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CarteStat titre="Projets" valeur={stats?.nombreProjets} icone={FolderKanban} accent="bg-[#12151F] text-white" />
          <CarteStat titre="Collaborateurs" valeur={stats?.nombreCollaborateurs} icone={Users2} accent="bg-slate-100 text-slate-700" />
          <CarteStat titre="Bugs totaux" valeur={stats?.nombreBugs} icone={Bug} accent="bg-blue-50 text-blue-700" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CarteStat titre="Bugs corrigés" valeur={stats?.bugsCorriges} icone={CheckCircle2} couleur="text-emerald-600" accent="bg-emerald-50 text-emerald-700" />
          <CarteStat titre="Bugs non corrigés" valeur={stats?.bugsNonCorriges} icone={XCircle} couleur="text-red-600" accent="bg-red-50 text-red-700" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/projets" className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#12151F] text-white group-hover:scale-105 transition-transform">
              <FolderKanban className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Voir mes projets</p>
              <p className="text-xs text-slate-500">Gérez vos dépôts et collaborations</p>
            </div>
            <span className="text-slate-400 group-hover:text-slate-900">→</span>
          </Link>
          <Link href="/bugs" className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
              <Bug className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Suivi des bugs</p>
              <p className="text-xs text-slate-500">Consultez tous les signalements</p>
            </div>
            <span className="text-slate-400 group-hover:text-slate-900">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CarteStat({
  titre, valeur, icone: Icone, couleur = "text-[#12151F]", accent,
}: {
  titre: string; valeur?: number; icone: React.ElementType; couleur?: string; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titre}</p>
          {valeur === undefined ? <Skeleton className="mt-2 h-7 w-12" /> : <p className={`mt-1 text-2xl font-bold tracking-tight ${couleur}`}>{valeur}</p>}
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ?? "bg-slate-100 text-slate-600"}`}>
          <Icone className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
