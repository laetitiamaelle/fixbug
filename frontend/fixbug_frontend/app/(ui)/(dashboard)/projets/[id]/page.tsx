"use client";
import { useAuth } from "@/context/auth-context";
import ApercuTesteur from "./apercu-testeur";
import ApercuChef from "./apercu-chef";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApercuProjetPage() {
  const { utilisateur, chargement } = useAuth(); // Ajoute un état de chargement si disponible dans ton context

  // 1. Pendant le chargement de la session
  if (chargement) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // 2. Affichage selon le rôle
  if (utilisateur?.role === "TESTEUR") {
    return <ApercuTesteur />;
  }

  // Permet aux chefs de projet ET aux développeurs d'accéder à l'aperçu
  if (utilisateur?.role === "CHEF_PROJET" || utilisateur?.role === "DEVELOPPEUR") {
    return <ApercuChef />;
  }

  // 3. Cas de secours si aucun rôle ne correspond ou utilisateur non connecté
  return (
    <div className="p-4 text-center text-slate-500">
      Accès non autorisé ou rôle non reconnu ({utilisateur?.role ?? "Non connecté"}).
    </div>
  );
}