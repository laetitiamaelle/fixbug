"use client";

import { Users, UserCheck, UserX, ShieldUser } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type StatistiquesUtilisateurs = {
  total: number;
  actifs: number;
  desactives: number;
  testeurs: number;
  chefsProjet: number;
};

const cartes = [
  { cle: "total" as const, label: "Total utilisateurs", icone: Users, iconeClass: "text-slate-500 bg-slate-100" },
  { cle: "actifs" as const, label: "Comptes actifs", icone: UserCheck, iconeClass: "text-emerald-600 bg-emerald-50" },
  { cle: "desactives" as const, label: "Comptes désactivés", icone: UserX, iconeClass: "text-red-600 bg-red-50" },
  { cle: "chefsProjet" as const, label: "Chefs de projet", icone: ShieldUser, iconeClass: "text-sky-600 bg-sky-50" },
];

export function StatsCards({ stats, chargement }: { stats: StatistiquesUtilisateurs | null; chargement: boolean }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cartes.map((carte) => {
        const Icone = carte.icone;
        return (
          <Card key={carte.cle}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{carte.label}</CardTitle>
              <div className={`rounded-lg p-2 ${carte.iconeClass}`}>
                <Icone className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {chargement ? (
                <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="text-2xl font-bold text-[#12151F]">{stats ? stats[carte.cle] : 0}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}