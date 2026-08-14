"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Users2, Bug, CheckCircle2, Clock, XCircle } from "lucide-react";
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
    if (utilisateur && utilisateur.role === "TESTEUR") {
      router.replace("/projets");
    }
  }, [utilisateur, router]);

  useEffect(() => {
    apiFetch("/projets/statistiques").then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#12151F]">Bienvenue {utilisateur?.prenom} </h1>
      <p className="mb-6 text-sm text-slate-500">Voici un aperçu de votre activité.</p>

      <div className="">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <CarteStat titre="Projets" valeur={stats?.nombreProjets} icone={FolderKanban} />
        <CarteStat titre="Collaborateurs" valeur={stats?.nombreCollaborateurs} icone={Users2} />
        <CarteStat titre="Bugs" valeur={stats?.nombreBugs} icone={Bug} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <CarteStat titre="Corrigés" valeur={stats?.bugsCorriges} icone={CheckCircle2} couleur="text-emerald-600" />
        <CarteStat titre="Non corrigés" valeur={stats?.bugsNonCorriges} icone={XCircle} couleur="text-red-600" />
        </div>
      </div>
    </div>
  );
}

function CarteStat({
  titre, valeur, icone: Icone, couleur = "text-[#12151F]",
}: {
  titre: string; valeur?: number; icone: React.ElementType; couleur?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Icone className="h-3.5 w-3.5" /> {titre}
      </div>
      {valeur === undefined ? <Skeleton className="h-7 w-10" /> : <p className={`text-2xl font-bold ${couleur}`}>{valeur}</p>}
    </div>
  );
}