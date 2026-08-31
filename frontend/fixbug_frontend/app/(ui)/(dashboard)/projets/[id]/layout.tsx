"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function ProjetLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { utilisateur } = useAuth();
  const base = `/projets/${params.id}`;
  const [projet, setProjet] = useState<{ nom: string; estProprietaire: boolean } | null>(null);

  useEffect(() => {
    apiFetch(`/projets/${params.id}`).then(setProjet).catch(() => setProjet(null));
  }, [params.id]);

  const estTesteur = utilisateur?.role === "TESTEUR";
  const estDeveloppeur = utilisateur?.role === "DEVELOPPEUR";

  // Redirection par défaut du développeur s'il arrive sur la racine du projet
  useEffect(() => {
    if (estDeveloppeur && pathname === base) {
      router.replace(`${base}/bugs`);
    }
  }, [estDeveloppeur, pathname, base, router]);

  // Définition dynamique des onglets selon le rôle du membre connecté
  const onglets = estTesteur
    ? [
        { href: base, label: "Déclarer un bug" },
        { href: `${base}/bugs`, label: "Bugs déclarés" },
      ]
    : [
        ...(!estDeveloppeur ? [{ href: base, label: "Aperçu" }] : []),
        { href: `${base}/bugs`, label: "Bugs" },
        ...(projet?.estProprietaire
          ? [
              { href: `${base}/collaborateurs`, label: "Collaborateurs" },
              { href: `${base}/parametres`, label: "Paramètres" },
            ]
          : []),
      ];

  return (
    <div>
      <Link href="/projets" className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-[#12151F]">
        <ArrowLeft className="h-4 w-4" /> Retour aux projets
      </Link>

      <h1 className="mb-4 text-2xl font-bold text-[#12151F]">{projet?.nom ?? "..."}</h1>

      {/* Barre d'onglets de navigation */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {onglets.map((onglet) => {
          const actif = pathname === onglet.href;
          return (
            <Link
              key={onglet.href}
              href={onglet.href}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                actif
                  ? "border-[#12151F] text-[#12151F]"
                  : "border-transparent text-slate-500 hover:text-[#12151F]"
              }`}
            >
              {onglet.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}