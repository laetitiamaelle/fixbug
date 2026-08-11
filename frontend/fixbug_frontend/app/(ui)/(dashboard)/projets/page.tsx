"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Bug, FolderGit2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconeGithub } from "../../../components/icone-github";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

type Projet = {
  id: number;
  nom: string;
  description: string | null;
  lienGithub: string | null;
  technologies: string[];
  _count?: { bugs: number; collaborateurs: number };
};

export default function ProjetsPage() {
  const { utilisateur } = useAuth();
  const [projets, setProjets] = useState<Projet[] | null>(null);

  // NOUVEAU : le bouton "Nouveau projet" n'est jamais visible pour un Testeur
  const estChefProjet = utilisateur?.role === "CHEF_PROJET";

  useEffect(() => {
    apiFetch("/projets").then(setProjets).catch(() => setProjets([]));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#12151F]">Projets</h1>
            {projets && projets.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">
                {projets.length}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {estChefProjet ? "Gérez vos projets et suivez leur activité." : "Projets auxquels vous collaborez."}
          </p>
        </div>

        {/* NOUVEAU : bouton conditionnel */}
        {estChefProjet && (
          <Link href="/projets/nouveau" className={buttonVariants({ className: "bg-[#12151F] hover:bg-[#12151F]/90" })}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {projets === null ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3.5 border-b border-slate-100 p-5 last:border-0">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-64" />
                <div className="mt-3 flex gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))
        ) : projets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <FolderGit2 size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Aucun projet pour le moment</p>
              {/* NOUVEAU : message différent selon le rôle */}
              <p className="mt-0.5 text-sm text-slate-500">
                {estChefProjet
                  ? "Créez votre premier projet pour commencer."
                  : "Vous serez notifié(e) dès qu'un chef de projet vous invitera à collaborer."}
              </p>
            </div>
            {estChefProjet && (
              <Link href="/projets/nouveau" className={buttonVariants({ className: "mt-2 bg-[#12151F] hover:bg-[#12151F]/90" })}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau projet
              </Link>
            )}
          </div>
        ) : (
          projets.map((projet, i) => (
            <LigneProjet key={projet.id} projet={projet} dernier={i === projets.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

function LigneProjet({ projet, dernier }: { projet: Projet; dernier: boolean }) {
  return (
    <Link
      href={`/projets/${projet.id}`}
      className={`group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50 ${dernier ? "" : "border-b border-slate-100"}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#12151F] group-hover:text-white">
          <IconeGithub className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#12151F] group-hover:underline">{projet.nom}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {projet.description && <p className="mt-0.5 truncate text-sm text-slate-500">{projet.description}</p>}
          {projet.technologies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {projet.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="font-normal">{tech}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm text-slate-500">
        <span className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1">
          <Bug className="h-3.5 w-3.5 text-red-400" /> {projet._count?.bugs ?? 0}
        </span>
        <span className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1">
          <Users className="h-3.5 w-3.5 text-blue-400" /> {projet._count?.collaborateurs ?? 0}
        </span>
      </div>
    </Link>
  );
}