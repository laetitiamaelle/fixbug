"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ShieldUser, User, MoreVertical, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Utilisateur = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "TESTEUR" | "CHEF_PROJET" | "ADMINISTRATEUR";
  actif: boolean;
};

const labelsRole: Record<string, string> = {
  TESTEUR: "Testeur",
  CHEF_PROJET: "Chef de projet",
  ADMINISTRATEUR: "Administrateur",
};

type Actions = {
  onActiverDesactiver: (u: Utilisateur) => void;
  onSupprimer: (u: Utilisateur) => void;
};

export function creerColonnes({ onActiverDesactiver, onSupprimer }: Actions): ColumnDef<Utilisateur>[] {
  return [
    {
      id: "nomComplet",
      header: "Nom complet",
      cell: ({ row }) => (
        <span className="font-medium text-[#12151F]">
          {row.original.prenom} {row.original.nom}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-slate-600">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Rôle",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.role === "CHEF_PROJET"
              ? "font-normal bg-sky-50 text-sky-900 gap-1"
              : "font-normal bg-green-50 text-green-900 gap-1"
          }
        >
          {row.original.role === "CHEF_PROJET" ? <ShieldUser className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          {labelsRole[row.original.role]}
        </Badge>
      ),
    },
    {
      accessorKey: "actif",
      header: "Statut",
      cell: ({ row }) => (
        <Badge className={row.original.actif ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-700"}>
          {row.original.actif ? "Actif" : "Désactivé"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => {
        const utilisateur = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onActiverDesactiver(utilisateur)}>
                  {utilisateur.actif ? <><Ban className="mr-2 h-4 w-4" /> Désactiver</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Activer</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSupprimer(utilisateur)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}