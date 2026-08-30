"use client";
import { useAuth } from "@/context/auth-context";
import ApercuTesteur from "./apercu-testeur";
import ApercuChefEtDev from "./apercu-chef"; // ton fichier ApercuChef

export default function ApercuProjetPage() {
  const { utilisateur } = useAuth();
  if (utilisateur?.role === "TESTEUR") return <ApercuTesteur />;
  if (utilisateur?.role === "CHEF_PROJET") return <ApercuChefEtDev />;
  return null; // Développeur (et pendant le chargement) : rien à peindre, le layout redirige vers /bugs
}