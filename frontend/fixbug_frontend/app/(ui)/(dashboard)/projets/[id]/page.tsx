"use client";
import { useAuth } from "@/context/auth-context";
import ApercuTesteur from "./apercu-testeur";
import ApercuChef from "./apercu-chef";

export default function ApercuProjetPage() {
  const { utilisateur } = useAuth();

  if (utilisateur?.role === "TESTEUR") return <ApercuTesteur />;
  if (utilisateur?.role === "CHEF_PROJET") return <ApercuChef />;
  return null;
}