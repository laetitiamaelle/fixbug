"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Folder, FolderGit2 ,FolderOpenDot} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {Card} from "@/components/ui/card"

type Projet = { id: number; nom: string };

export default function ProjetsPage() {
  const { utilisateur } = useAuth();
  const [projets, setProjets] = useState<Projet[] | null>(null);
  const estChefProjet = utilisateur?.role === "CHEF_PROJET";

  useEffect(() => { apiFetch("/projets").then(setProjets).catch(() => setProjets([])); }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#12151F]">Projets</h1>
          <p className="mt-1 text-sm text-slate-500">
            {estChefProjet ? "Gérez vos projets et suivez leur activité." : "Projets auxquels vous collaborez."}
          </p>
        </div>
        {estChefProjet && (
          <Link href="/projets/nouveau" className={buttonVariants({ className: "bg-[#12151F] hover:bg-[#12151F]/90" })}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        )}
      </div>

      {projets === null ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : projets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><FolderGit2 size={20} className="text-slate-400" /></div>
          <p className="text-sm text-slate-500">
            {estChefProjet ? "Créez votre premier projet pour commencer." : "Vous serez notifié(e) dès qu'un chef de projet vous invitera."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {projets.map((projet) => (
            <Link
              key={projet.id}
              href={`/projets/${projet.id}`}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors hover:bg-slate-100"
            >
              <div className="flex h-16 w-16 items-center justify-center">
                <FolderOpenDot
                  className="h-26 w-26 fill-brand-slate text-[#353b4e] drop-shadow-sm"
                  strokeWidth={1}
                />
              </div>
              <span className="line-clamp-2 text-sm font-medium text-[#12151F]">{projet.nom}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}