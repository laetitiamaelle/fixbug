"use client";

import Link from "next/link";
import { ChevronDown, UserCog, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  userName: string;
  userEmail: string;
  userRole: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function Topbar({ userName, userEmail, userRole }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <Logo />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-slate-50">
            <Avatar className="bg-indigo-600">
              <AvatarFallback className="bg-indigo-600 font-semibold text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>

            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-slate-900">
                {userEmail}
              </span>
              <span className="block text-xs text-slate-400">{userRole}</span>
            </span>

            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profil" className="cursor-pointer">
              <UserCog className="h-4 w-4" />
              Modifier le profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="cursor-pointer">
            <LogOut className="h-4 w-4" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
