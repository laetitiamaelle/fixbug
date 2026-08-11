"use client";
import { Logo } from "../logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, Users2, UserPen, Bug, Bell, Mail, LogOut, ChevronRight, X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSidebar } from "../../../context/sidebar-context";
import { Skeleton } from "@/components/ui/skeleton";

const navCommune = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profil", label: "Profil", icon: UserPen },
];


const navBase = [
  { href: "/chef_projet", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/projets", label: "Projets", icon: FolderKanban },
  { href: "/bugs", label: "Suivi des bugs", icon: Bug },
];


const navTesteur = [
  ...navBase,
  { href: "/invitations", label: "Invitations", icon: Mail },
];

const navAdmin = [
  { href: "/admin", label: "Utilisateurs", icon: Users2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { utilisateur, chargement, deconnexion } = useAuth();
  const { ouvert, fermer } = useSidebar();

  let navPrincipale = navBase;
  if (utilisateur?.role === "ADMINISTRATEUR") navPrincipale = navAdmin;
  if (utilisateur?.role === "TESTEUR") navPrincipale = navTesteur;

  return (
    <>
      {/* Overlay mobile : visible seulement quand le menu est ouvert */}
      {ouvert && (
        <div
          onClick={fermer}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-[#12151F] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2.5 px-6 py-6">
          <Logo />
          <button
            onClick={fermer}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {chargement ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg bg-white/10" />)
          ) : (
            navPrincipale.map((item) => <LienNav key={item.href} item={item} actif={pathname === item.href} />)
          )}
        </nav>

        <div className="space-y-0.5 border-t border-white/10 px-3 py-4">
          {chargement ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg bg-white/10" />)
          ) : (
            navCommune.map((item) => <LienNav key={item.href} item={item} actif={pathname === item.href} />)
          )}
          <button
            onClick={deconnexion}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}

function LienNav({ item, actif }: { item: { href: string; label: string; icon: React.ElementType }; actif: boolean }) {
  const Icone = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        actif ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icone className={`h-4 w-4 ${actif ? "text-emerald-400" : ""}`} />
      <span className="flex-1">{item.label}</span>
      {actif && <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
    </Link>
  );
}