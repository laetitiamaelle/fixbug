"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { utilisateur } = useAuth();
  const router = useRouter();

  // un Testeur qui tape /dashboard directement est renvoyé vers /projets
  useEffect(() => {
    if (utilisateur && utilisateur.role === "TESTEUR") {
      router.replace("/projets");
    }
  }, [utilisateur, router]);
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-ink">Tableau de bord</h1>
      <p className="mt-2 text-brand-slate">Vue d'ensemble de vos projets et bugs.</p>
    </div>
  );
}