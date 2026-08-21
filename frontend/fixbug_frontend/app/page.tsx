"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  ArrowRight,
  Database,
  Sparkles,
  Code2,
  FolderGit2,
  Camera,
  Bot,
  GitPullRequest,
  BarChart3,
  ShieldCheck,
  Users,
  UserCheck,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./components/logo";
import { IconeGithub } from "./components/icone-github";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface NavLink {
  label: string;
  href: string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface Step {
  n: string;
  title: string;
  desc: string;
}

interface Role {
  icon: LucideIcon;
  title: string;
  desc: string;
}

/* ------------------------------------------------------------------ */
/* Hook: révèle les sections au scroll                                */
/* ------------------------------------------------------------------ */
function useReveal() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = rootRef.current
      ? rootRef.current.querySelectorAll<HTMLElement>(".reveal")
      : [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return rootRef;
}

export default function FixbugLanding() {
  const revealRoot = useReveal();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks: NavLink[] = [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Comment ça marche", href: "#comment-ca-marche" },
    { label: "Les rôles", href: "#roles" },
  ];

  const roles: Role[] = [
    {
      icon: Camera,
      title: "Testeur",
      desc: "Signale un bug avec une description et des captures d'écran. Aucun accès au code, aucun compte GitHub requis.",
    },
    {
      icon: Bot,
      title: "Développeur",
      desc: "Prend en charge le bug, sollicite l'agent IA, examine sa proposition puis la valide avant tout envoi sur le dépôt.",
    },
    {
      icon: ClipboardList,
      title: "Chef de projet",
      desc: "Pilote le projet, gère les collaborateurs et suit la livrabilité globale — sans intervenir techniquement sur le code.",
    },
  ];

  const features: Feature[] = [
    {
      icon: FolderGit2,
      title: "Projets connectés à GitHub",
      desc: "Connexion OAuth GitHub pour les chefs de projet et développeurs, dépôt et branche principale associés à chaque projet.",
    },
    {
      icon: Camera,
      title: "Signalement en un clic",
      desc: "Les testeurs décrivent l'anomalie et joignent une ou plusieurs captures d'écran, sans jamais toucher au code.",
    },
    {
      icon: Bot,
      title: "Agent IA sur demande",
      desc: "L'IA n'agit jamais seule : elle n'intervient qu'à la demande explicite d'un développeur, sur une tâche précise.",
    },
    {
      icon: UserCheck,
      title: "Validation humaine obligatoire",
      desc: "Le développeur examine la proposition de l'IA (fichiers, diff) et la valide ou la rejette avant tout envoi sur GitHub.",
    },
    {
      icon: GitPullRequest,
      title: "Pull Request après validation",
      desc: "Une fois validée, l'agent crée la branche, commit, pousse les changements et ouvre la Pull Request.",
    },
    {
      icon: BarChart3,
      title: "Suivi de livrabilité",
      desc: "Le chef de projet suit en temps réel l'état des bugs et la livrabilité globale de chaque projet.",
    },
  ];

  const steps: Step[] = [
    {
      n: "01",
      title: "Déclarer",
      desc: "Un testeur décrit le bug rencontré et ajoute des captures d'écran.",
    },
    {
      n: "02",
      title: "Prendre en charge",
      desc: "Un développeur prend le bug en charge sur son projet.",
    },
    {
      n: "03",
      title: "Analyser",
      desc: "Il sollicite l'agent IA, qui explore le dépôt et propose une correction.",
    },
    {
      n: "04",
      title: "Valider",
      desc: "Le développeur examine la proposition et la valide, ou en redemande une.",
    },
    {
      n: "05",
      title: "Pull Request créée",
      desc: "L'agent commit, pousse les changements et ouvre la Pull Request.",
    },
  ];

  return (
    <div ref={revealRoot} className="min-h-screen bg-white font-sans antialiased">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4.5s ease-in-out infinite; }
        .animate-float-delayed { animation: float 4.5s ease-in-out infinite; animation-delay: 1.6s; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal { opacity: 0; }
        .reveal.in-view { animation: fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .reveal.d1.in-view { animation-delay: 0.08s; }
        .reveal.d2.in-view { animation-delay: 0.16s; }
        .reveal.d3.in-view { animation-delay: 0.24s; }
        .reveal.d4.in-view { animation-delay: 0.32s; }
        .reveal.d5.in-view { animation-delay: 0.4s; }
        .reveal.d6.in-view { animation-delay: 0.48s; }

        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-float-delayed { animation: none !important; }
          .reveal, .reveal.in-view { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>

      {/* ------------------------------------------------------------ */}
      {/* NAVBAR                                                       */}
      {/* ------------------------------------------------------------ */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-[#0B0E17] transition-colors hover:text-emerald-600"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/connexion"
              className="text-sm font-semibold text-[#0B0E17] transition-colors hover:text-slate-600"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0E17] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
            >
              S'inscrire
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-[#0B0E17] lg:hidden"
            aria-label="Ouvrir le menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-5 lg:hidden">
            <nav className="flex flex-col gap-4">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-[#0B0E17] hover:text-emerald-600"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-4">
                <Link
                  href="/connexion"
                  className="text-sm font-semibold text-[#0B0E17]"
                  onClick={() => setMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-lg bg-[#0B0E17] px-4 py-2 text-center text-sm font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  S'inscrire
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------ */}
      {/* HERO                                                         */}
      {/* ------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-white pb-24 pt-40">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-slate-200/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
          {/* Texte */}
          <div>
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-slate-600">
                IA supervisée par un développeur
              </span>
            </div>

            <h1 className="reveal d1 mt-6 font-serif text-4xl font-bold leading-tight tracking-tight text-[#0B0E17] sm:text-5xl">
              Un bug signalé.
              <br />
              Une correction <span className="text-emerald-500">validée par un humain</span>.
            </h1>

            <p className="reveal d2 mt-6 max-w-lg text-lg leading-relaxed text-slate-500">
              Un testeur signale, un développeur sollicite l'agent IA et examine
              sa proposition, puis la valide. Ce n'est qu'à ce moment que la
              Pull Request est ouverte sur GitHub — le contrôle reste humain à
              chaque étape sensible.
            </p>

            <div className="reveal d3 mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/inscription"
                className="group inline-flex items-center gap-2 rounded-lg bg-[#0B0E17] px-6 py-3 font-semibold text-white transition-all hover:bg-slate-800"
              >
                Créer un compte gratuit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#comment-ca-marche"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-semibold text-[#0B0E17] transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                Voir comment ça marche
              </a>
            </div>

            <div className="reveal d4 mt-10 flex items-center gap-2 text-sm text-slate-500">
              <IconeGithub  className="h-4 w-4" />
              <span>Connexion OAuth GitHub pour chefs de projet et développeurs.</span>
            </div>
          </div>

          {/* Visuel */}
          <div className="reveal d2 relative">
            <div className="relative h-96 w-full overflow-hidden rounded-3xl border border-slate-200 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop"
                alt="Développeur analysant une proposition de correction"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E17]/50 via-transparent to-transparent" />
            </div>

            

            <div className="animate-float-delayed absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
              </span>
              <span className="text-sm font-medium text-slate-800">
                Validé par le développeur
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* BANDE OUTILS                                                 */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center font-mono text-xs uppercase tracking-wider text-slate-400">
            S'intègre à votre stack
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-slate-400">
            <div className="flex items-center gap-2">
              <IconeGithub  className="h-5 w-5" />
              <span className="text-sm font-medium">GitHub (OAuth + Octokit)</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              <span className="text-sm font-medium">React / Next.js / NestJS</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span className="text-sm font-medium">PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">OpenRouter</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* LES RÔLES                                                    */}
      {/* ------------------------------------------------------------ */}
      <section id="roles" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-emerald-600">
              Les rôles
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#0B0E17] sm:text-4xl">
              Trois rôles, des responsabilités clairement délimitées
            </h2>
            <p className="mt-4 text-slate-600">
              Chaque acteur agit dans son périmètre : le testeur signale, le
              développeur corrige avec l'IA, le chef de projet pilote.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {roles.map((r, i) => (
              <div
                key={r.title}
                className={`reveal d${i + 1} rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg sm:text-left`}
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B0E17] text-white sm:mx-0">
                  <r.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#0B0E17]">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* FONCTIONNALITÉS                                              */}
      {/* ------------------------------------------------------------ */}
      <section id="fonctionnalites" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-emerald-600">
              Fonctionnalités
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#0B0E17] sm:text-4xl">
              Tout ce qu'il faut pour corriger sans perdre le contrôle
            </h2>
            <p className="mt-4 text-slate-600">
              De la déclaration d'une anomalie à la Pull Request validée,
              chaque étape est centralisée, tracée, et supervisée par un humain.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`reveal d${(i % 3) + 1} rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${
                    i % 2 === 0
                      ? "bg-[#0B0E17] text-white"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#0B0E17]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* COMMENT ÇA MARCHE                                            */}
      {/* ------------------------------------------------------------ */}
      <section id="comment-ca-marche" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-emerald-600">
              Comment ça marche
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#0B0E17] sm:text-4xl">
              Du signalement à la Pull Request, en 5 étapes
            </h2>
          </div>

          <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="pointer-events-none absolute left-0 right-0 top-6 hidden border-t border-dashed border-slate-300 lg:block" />
            {steps.map((s, i) => (
              <div key={s.n} className={`reveal d${(i % 6) + 1} relative`}>
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white font-mono text-sm text-[#0B0E17] shadow-sm">
                  {s.n}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[#0B0E17]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* POURQUOI FIXBUG                                              */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div className="reveal d1 text-center sm:text-left">
              <ShieldCheck className="mx-auto h-8 w-8 text-[#0B0E17] sm:mx-0" />
              <h3 className="mt-4 text-lg font-semibold text-[#0B0E17]">Sécurisé</h3>
              <p className="mt-2 text-sm text-slate-600">
                Authentification classique et OAuth GitHub, droits d'accès par
                rôle, chiffrement des mots de passe et des tokens sensibles.
              </p>
            </div>
            <div className="reveal d2 text-center sm:text-left">
              <UserCheck className="mx-auto h-8 w-8 text-[#0B0E17] sm:mx-0" />
              <h3 className="mt-4 text-lg font-semibold text-[#0B0E17]">Sous contrôle</h3>
              <p className="mt-2 text-sm text-slate-600">
                L'IA n'agit jamais seule : elle attend une demande explicite et
                une validation avant tout envoi vers GitHub.
              </p>
            </div>
            <div className="reveal d3 text-center sm:text-left">
              <Users className="mx-auto h-8 w-8 text-[#0B0E17] sm:mx-0" />
              <h3 className="mt-4 text-lg font-semibold text-[#0B0E17]">Collaboratif</h3>
              <p className="mt-2 text-sm text-slate-600">
                Testeurs, développeurs et chefs de projet travaillent ensemble,
                avec des invitations simples et un suivi partagé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* CTA FINAL                                                    */}
      {/* ------------------------------------------------------------ */}
      <section className="bg-[#0B0E17] py-20">
        <div className="reveal mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Prêt à corriger vos bugs sans perdre le contrôle ?
          </h2>
          <p className="mt-4 text-slate-400">
            Créez votre projet, connectez votre dépôt GitHub et laissez vos
            développeurs superviser l'IA à chaque étape.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-[#0B0E17] transition-all hover:bg-slate-100"
            >
              Créer un compte gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-semibold text-slate-200 transition-colors hover:border-white/30 hover:text-white"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* FOOTER                                                       */}
      {/* ------------------------------------------------------------ */}
      <footer className="bg-[#e7eaf2] py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="col-span-2">
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-slate-500">
                La plateforme qui relie testeurs, développeurs, chefs de projet
                et un agent IA supervisé à votre dépôt GitHub.
              </p>
              <div className="mt-5 flex items-center gap-4 text-slate-500">
                <a href="#" aria-label="GitHub" className="hover:text-[#0B0E17]">
                  <IconeGithub  className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
                Produit
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                <li><a href="#fonctionnalites" className="hover:text-[#0B0E17]">Fonctionnalités</a></li>
                <li><a href="#comment-ca-marche" className="hover:text-[#0B0E17]">Comment ça marche</a></li>
                <li><a href="#roles" className="hover:text-[#0B0E17]">Les rôles</a></li>
              </ul>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
                Compte
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                <li><Link href="/inscription" className="hover:text-[#0B0E17]">Inscription</Link></li>
                <li><Link href="/connexion" className="hover:text-[#0B0E17]">Connexion</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-300 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Fixbug. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}