"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const projetFictif = { id: 1, nom: "Fixbug" }; // TODO: remplacer par un fetch(`/projets/${id}`)

export default function ProjetLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const base = `/projets/${params.id}`;

  const onglets = [
    { href: base, label: "Aperçu" },
    { href: `${base}/bugs`, label: "Bugs" },
    { href: `${base}/collaborateurs`, label: "Collaborateurs" }, // TODO: masquer si l'utilisateur n'est pas le chef de ce projet
    { href: `${base}/parametres`, label: "Paramètres" }, // TODO: masquer si l'utilisateur n'est pas le chef de ce projet
  ];

  return (
    <div>
      <Link href="/projets" className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-[#12151F]">
        <ArrowLeft className="h-4 w-4" /> Retour aux projets
      </Link>

      <h1 className="mb-4 text-2xl font-bold text-[#12151F]">{projetFictif.nom}</h1>

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