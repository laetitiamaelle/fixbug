"use client";

import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/notifications-context";
import { Bell, ChevronDown, LogOut, Menu, ShieldCheck, User, Code2, ShieldUser, UserPen } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useSidebar } from "@/context/sidebar-context";
import { Badge } from "@/components/ui/badge"

const labelsRole: Record<string, string> = {
  TESTEUR: "Testeur", CHEF_PROJET: "Chef de projet", ADMINISTRATEUR: "Administrateur", DEVELOPPEUR: "Développeur",
};

const roleConfig: Record<string, { className: string; icon: React.ReactNode }> = {
  CHEF_PROJET: { className: "bg-sky-50 text-sky-700 border-sky-200", icon: <ShieldUser className="h-3 w-3.5 text-sky-600" /> },
  DEVELOPPEUR: { className: "bg-violet-50 text-violet-700 border-violet-200", icon: <Code2 className="h-3 w-3.5 text-violet-600" /> },
  TESTEUR: { className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <User className="h-3 w-3.5 text-emerald-600" /> },
  ADMINISTRATEUR: { className: "bg-red-50 text-red-700 border-red-200", icon: <ShieldCheck className="h-3 w-3.5 text-red-600" /> }
}

function NotificationsDropdown() {
  const { notifications, nonLues, marquerLue, marquerToutesLues } = useNotifications();
  const router = useRouter();

  const recents = notifications?.slice(0, 6) ?? null;

  return (
    <div className="flex flex-col max-h-[420px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div>
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <p className="text-xs text-slate-500">{nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Tout est à jour"}</p>
        </div>
        {nonLues > 0 && (
          <button onClick={() => marquerToutesLues()} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Tout marquer comme lu</button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
        {recents === null ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2"><div className="h-3 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-full" /></div>
              </div>
            ))}
          </div>
        ) : recents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 mb-3"><Bell className="h-5 w-5 text-slate-400" /></div>
            <p className="text-sm font-medium text-slate-900">Aucune notification</p>
            <p className="text-xs text-slate-500 mt-1">Vous serez notifié ici des activités importantes.</p>
          </div>
        ) : (
          recents.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.lue && marquerLue(n.id)}
              className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors ${!n.lue ? "bg-amber-50/50" : ""}`}
            >
              <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!n.lue ? "bg-amber-500" : "bg-transparent"}`} />
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${!n.lue ? "bg-[#0B0E17] text-white" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                <Bell className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <p className={`text-[13px] leading-tight truncate ${!n.lue ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>{n.titre}</p>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.contenu}</p>
                <p className="text-[11px] text-slate-400 mt-1">{new Date(n.dateEnvoie).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </span>
            </button>
          ))
        )}
      </div>

      <div className="p-2 border-t border-slate-100 bg-white">
        <button
          onClick={() => router.push("/notifications")}
          className="w-full rounded-lg bg-[#0B0E17] py-2 text-sm font-medium text-white hover:bg-[#1a1f2e] transition-colors"
        >
          Voir toutes les notifications
        </button>
      </div>
    </div>
  );
}

export function Topbar() {
  const { utilisateur, chargement, deconnexion } = useAuth();
  const { ouvrir } = useSidebar();
  const router = useRouter();
  const { nonLues } = useNotifications();
  const currentRoleConfig = utilisateur?.role ? (roleConfig[utilisateur.role] || roleConfig.TESTEUR) : roleConfig.TESTEUR;

  return (
    <header className="flex h-[64px] items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 sm:px-6 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={ouvrir}
          className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-[600] tracking-[-0.01em] text-slate-900">Bienvenue{utilisateur ? `, ${utilisateur.prenom}` : ""} 👋</p>
          <p className="text-xs text-slate-500 -mt-0.5">Voici votre espace de travail</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 outline-none">
            <Bell className="h-[18px] w-[18px]" />
            {nonLues > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-[700] text-white shadow-sm ring-2 ring-white">
                {nonLues > 9 ? "9+" : nonLues}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[380px] p-0 rounded-xl shadow-xl overflow-hidden">
            <NotificationsDropdown />
          </DropdownMenuContent>
        </DropdownMenu>

        {chargement || !utilisateur ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm outline-none transition-all hover:bg-slate-50 hover:shadow">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B0E17] text-xs font-[700] tracking-tight text-white">
                {`${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-[13px] font-[600] leading-tight tracking-[-0.01em] text-[#0B0E17]">{utilisateur.prenom} {utilisateur.nom}</p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-[600] ${currentRoleConfig.className}`}>
                  {currentRoleConfig.icon} {labelsRole[utilisateur.role]}
                </span>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-900">{utilisateur.prenom} {utilisateur.nom}</p>
                <p className="text-xs text-slate-500">{utilisateur.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profil")} className="rounded-lg">
                <UserPen className="mr-2 h-4 w-4" /> Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={deconnexion} className="rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
