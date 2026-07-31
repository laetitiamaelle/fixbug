import Link from "next/link";
import { Logo } from "../logo";

const columns = [
  {
    title: "Produit",
    links: ["Fonctionnalités", "Intégrations", "Tarification"],
  },
  {
    title: "Société",
    links: ["À propos", "Blog", "Carrières"],
  },
  {
    title: "Légal",
    links: ["Confidentialité", "Conditions", "Sécurité"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              La plateforme intelligente de gestion de bugs assistée par IA,
              conçue pour les équipes de développement modernes.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900">
                {col.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-slate-500 hover:text-slate-900"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} FixBug SaaS. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
