"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/notifications-context";
import { Search, UserPen, Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useSidebar } from "@/context/sidebar-context";
import { apiFetch } from "@/lib/api";

const labelsRole: Record<string, string> = {
  TESTEUR: "Testeur", CHEF_PROJET: "Chef de projet", ADMINISTRATEUR: "Administrateur",
};

export function Topbar() {
  const { utilisateur, chargement, deconnexion } = useAuth();
  const { ouvrir } = useSidebar();
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const { nonLues } = useNotifications(); 

 

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={ouvrir}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          onClick={() => router.push("/notifications")}
          className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {nonLues > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </button>

        {chargement || !utilisateur ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 outline-none transition-colors hover:bg-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#12151F] text-sm font-semibold text-white">
                {`${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-[#12151F]">{utilisateur.prenom} {utilisateur.nom}</p>
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