"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  Users,
  Bug,
  FileBarChart2,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "../../components/logo";

const mainLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/dashboard/projets", label: "Projets", icon: FolderKanban },
  { href: "/dashboard/collaborateurs", label: "Collaborateurs", icon: Users },
  { href: "/dashboard/bugs", label: "Suivi des bugs", icon: Bug },
  { href: "/dashboard/rapports", label: "Rapports", icon: FileBarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900 px-4 py-6">
      <div className="px-2">
        <Logo  />
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {mainLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-800 pt-4">
        <Link
          href="/dashboard/notifications"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          Notifications
        </Link>
        <Link
          href="/dashboard/parametres"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </Link>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-slate-800">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
