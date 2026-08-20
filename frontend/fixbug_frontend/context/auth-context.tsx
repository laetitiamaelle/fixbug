"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Utilisateur = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "TESTEUR" |"DEVELOPPEUR" |"CHEF_PROJET" | "ADMINISTRATEUR";
};

type AuthContextType = {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  deconnexion: () => void;
  rafraichir: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const router = useRouter();

  const rafraichir = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUtilisateur(null);
      setChargement(false);
      return;
    }
    try {
      const data = await apiFetch("/users/moi");
      setUtilisateur(data);
    } catch {
      setUtilisateur(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  function deconnexion() {
    localStorage.removeItem("token");
    setUtilisateur(null);
    router.push("/connexion");
  }

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, deconnexion, rafraichir }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  return ctx;
}