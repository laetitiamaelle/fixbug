"use client";
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPen, Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useSidebar } from "../../../context/sidebar-context";
import { Skeleton } from "@/components/ui/skeleton";

const labelsRole: Record<string, string> = {
  TESTEUR: "Testeur",
  CHEF_PROJET: "Chef de projet",
  ADMINISTRATEUR: "Administrateur",
};

export function Topbar() {
  const { utilisateur, chargement, deconnexion } = useAuth();
  const { ouvrir } = useSidebar();
  const router = useRouter();
  const [recherche, setRecherche] = useState("");

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        {/* Bouton hamburger : visible seulement en mobile/tablette */}
        <button
          onClick={ouvrir}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher ..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-slate-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/notifications"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
        >
          <Bell className="h-5 w-5" />
        </Link>

        {chargement || !utilisateur ? (
          <div className="flex items-center gap-2.5 py-1.5 pl-1.5 pr-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="hidden space-y-1 sm:block">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 outline-none transition-colors hover:bg-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#12151F] text-sm font-semibold text-white">
                {`${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()}
              </div>
              {/* Nom/rôle masqués sur mobile pour gagner de la place, avatar seul suffit */}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-[#12151F]">
                  {utilisateur.prenom} {utilisateur.nom}
                </p>
                <p className="text-xs leading-tight text-slate-500">{labelsRole[utilisateur.role]}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push("/profil")}>
                <UserPen className="mr-2 h-4 w-4" /> Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={deconnexion} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}