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
import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/dashboard/projets", label: "Projets", icon: FolderKanban },
  { href: "/dashboard/collaborateurs", label: "Collaborateurs", icon: Users },
  { href: "/dashboard/bugs", label: "Suivi des bugs", icon: Bug },
  { href: "/dashboard/rapports", label: "Rapports", icon: FileBarChart2 },
];

// Classes communes pour un item de nav non-actif sur fond sombre
const navItemClass =
  "text-slate-300 hover:bg-sidebar-accent hover:text-white data-[active=true]:bg-white data-[active=true]:text-slate-900 data-[active=true]:hover:bg-white data-[active=true]:hover:text-slate-900";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 py-4">
        <Logo variant="light" />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu>
            {mainLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === link.href}
                  tooltip={link.label}
                  className={navItemClass}
                >
                  <Link href={link.href}>
                    <link.icon />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Notifications" className={navItemClass}>
              <Link href="/dashboard/notifications">
                <Bell />
                <span>Notifications</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Paramètres" className={navItemClass}>
              <Link href="/dashboard/parametres">
                <Settings />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Déconnexion"
              className="text-red-400 hover:bg-sidebar-accent hover:text-red-300"
            >
              <LogOut />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
