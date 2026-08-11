"use client";
import { SidebarProvider } from "@/context/sidebar-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/auth-context";
import { Sidebar } from "../../components/dasboardComponents/sidebar";
import { Topbar } from "../../components/dasboardComponents/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { utilisateur, chargement } = useAuth();
  const router = useRouter();

  // NOUVEAU : dès que la vérification du token est terminée (chargement = false),
  // si aucun utilisateur n'a été trouvé (pas de token, ou token invalide/expiré),
  // on redirige immédiatement vers la connexion. C'est CETTE ligne qui empêche
  // d'accéder au dashboard juste en tapant l'URL sans être connecté.
  useEffect(() => {
    if (!chargement && !utilisateur) {
      router.replace("/connexion");
    }
  }, [chargement, utilisateur, router]);

  // Tant qu'on vérifie le token, ou si on n'a pas d'utilisateur (redirection en cours),
  // on affiche un état neutre — jamais le contenu protégé avant confirmation.
  if (chargement || !utilisateur) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
      <SidebarProvider>
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
    </SidebarProvider>
  );
}