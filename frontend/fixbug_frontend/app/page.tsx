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

interface NavLink { label: string; href: string; }
interface Feature { icon: LucideIcon; title: string; desc: string; }
interface Step { n: string; title: string; desc: string; }
interface Role { icon: LucideIcon; title: string; desc: string; }

function useReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nodes = rootRef.current ? rootRef.current.querySelectorAll<HTMLElement>(".reveal") : [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
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
    { icon: Camera, title: "Testeur", desc: "Signale un bug avec description et captures d'écran. Aucun accès au code" },
    { icon: Bot, title: "Développeur", desc: "Prend en charge le bug, sollicite l'agent IA, examine sa proposition puis la valide avant tout envoi sur le dépôt." },
    { icon: ClipboardList, title: "Chef de projet", desc: "Pilote le projet, gère les collaborateurs et suit la livrabilité globale , sans intervenir techniquement sur le code." },
  ];

  const features: Feature[] = [
    { icon: FolderGit2, title: "Projets connectés à GitHub", desc: "dépôt associés à chaque projet." },
    { icon: Camera, title: "Signalement en un clic", desc: "Les testeurs décrivent l'anomalie et joignent une ou plusieurs captures d'écran, sans jamais toucher au code." },
    { icon: Bot, title: "Agent IA sur demande", desc: "L'IA n'agit jamais seule : elle n'intervient qu'à la demande explicite d'un développeur, sur une tâche précise." },
    { icon: UserCheck, title: "Validation humaine obligatoire", desc: "Le développeur examine la proposition de l'IA  et la valide ou la rejette avant tout envoi sur GitHub." },
    { icon: GitPullRequest, title: "Pull Request après validation", desc: "Une fois validée, le developpeur pousse les changements et ouvre la Pull Request." },
    { icon: BarChart3, title: "Suivi de livrabilité", desc: "Le chef de projet suit en temps réel l'état des bugs et la livrabilité globale de chaque projet." },
  ];

  const steps: Step[] = [
    { n: "01", title: "Déclarer", desc: "Un testeur décrit le bug rencontré et ajoute des captures d'écran." },
    { n: "02", title: "Prendre en charge", desc: "Un développeur prend le bug en charge sur son projet." },
    { n: "03", title: "Analyser", desc: "Il sollicite l'agent IA, qui explore le dépôt et propose une correction." },
    { n: "04", title: "Valider", desc: "Le développeur examine la proposition et la valide, ou en redemande une." },
    { n: "05", title: "Pull Request créée", desc: "le developpeur, pousse les changements et ouvre la Pull Request." },
  ];

  return (
    <div ref={revealRoot} className="min-h-screen bg-white font-sans antialiased selection:bg-emerald-500/20 overflow-x-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .animate-float{animation:float 5s ease-in-out infinite}
        .animate-float-delayed{animation:float 5s ease-in-out infinite;animation-delay:1.2s}
        @keyframes fade-up{ from{opacity:0;transform:translateY(18px) scale(0.98);filter:blur(4px)} to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)} }
        .reveal{opacity:0;will-change:transform,opacity}
        .reveal.in-view{animation:fade-up 0.65s cubic-bezier(0.16,1,0.3,1) forwards}
        .reveal.d1.in-view{animation-delay:0.06s}.reveal.d2.in-view{animation-delay:0.12s}.reveal.d3.in-view{animation-delay:0.18s}.reveal.d4.in-view{animation-delay:0.24s}
        @media(prefers-reduced-motion:reduce){.animate-float,.animate-float-delayed{animation:none!important}.reveal,.reveal.in-view{opacity:1!important;animation:none!important;transform:none!important;filter:none!important}}
      `}</style>

      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-[13.5px] font-[550] tracking-[-0.01em] text-slate-700 transition-colors hover:text-[#0B0E17] relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-[#0B0E17] after:transition-all hover:after:w-full">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2.5 lg:flex">
            <Link href="/connexion" className="rounded-lg px-4 py-2 text-[13.5px] font-[600] tracking-[-0.01em] text-[#0B0E17] transition-colors hover:bg-slate-100">Connexion</Link>
            <Link href="/inscription" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0E17] px-4 py-2.5 text-[13.5px] font-[600] tracking-[-0.01em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] transition-all hover:bg-[#1a1f2e] hover:shadow-md hover:-translate-y-[1px] active:translate-y-0">S'inscrire <ArrowRight className="h-3.5 w-3.5 opacity-80" /></Link>
          </div>
          <button onClick={() => setMenuOpen((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0B0E17] shadow-sm transition-colors hover:bg-slate-50 lg:hidden" aria-label="Ouvrir le menu" aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6 lg:hidden shadow-xl">
            <nav className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B0E17]">{l.label}</a>
              ))}
              <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-4">
                <Link href="/connexion" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0B0E17] hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Connexion</Link>
                <Link href="/inscription" className="rounded-lg bg-[#0B0E17] px-4 py-2.5 text-center text-sm font-semibold text-white" onClick={() => setMenuOpen(false)}>S'inscrire</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-white pb-12 pt-24 sm:pb-16 sm:pt-32">
        <div className="pointer-events-none absolute -top-32 left-[10%] h-[320px] w-[320px] sm:h-[480px] sm:w-[480px] rounded-full bg-emerald-500/[0.07] blur-[60px] sm:blur-[70px]" />
        <div className="pointer-events-none absolute -top-20 right-[5%] h-[280px] w-[280px] sm:h-[420px] sm:w-[420px] rounded-full bg-violet-500/[0.05] blur-[50px] sm:blur-[70px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-slate-200/40 blur-[50px]" />
        <div className="pointer-events-none absolute inset-0 bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12">
          <div className="w-full min-w-0">
            <div className="reveal inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-slate-600"></span>
              
            </div>

            <h1 className="reveal d1 mt-6 max-w-[600px] text-[30px] font-[720] leading-[0.95] tracking-[-0.03em] text-[#0B0E17] sm:text-[42px] lg:text-[48px] xl:text-[52px]">
              Un bug signalé<br />Une correction<br /><span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">validée par un humain</span>
            </h1>

            <p className="reveal d2 mt-5 max-w-[540px] text-[15px] leading-[1.7] text-slate-600 sm:text-[16px]">
              Un testeur signale, un développeur sollicite l’agent IA et examine sa proposition, puis la valide. Ce n’est qu’à ce moment que la Pull Request est ouverte sur GitHub ,le contrôle reste humain à chaque étape sensible.
            </p>

            <div className="reveal d3 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/inscription" className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#0B0E17] px-6 py-[13px] text-[14px] font-[600] tracking-[-0.01em] text-white shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] transition-all hover:bg-[#151a2a] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] hover:-translate-y-px active:translate-y-0">Créer un compte <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
              <a href="#comment-ca-marche" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-[13px] text-[14px] font-[600] tracking-[-0.01em] text-[#0B0E17] shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow">Voir comment ça marche</a>
            </div>
          </div>

          <div className="reveal  animate-float-delayed d2 relative  w-full min-w-0 lg:pl-4">
            <div className="relative overflow-hidden  rounded-[20px] sm:rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.22),0_8px_24px_-8px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/70 px-3 sm:px-4 py-3">
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-400" />
              </div>
              <div className="relative  h-[280px] sm:h-[360px] w-full overflow-hidden bg-slate-900">
                <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop" alt="Développeur analysant une proposition de correction" className="h-full w-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                
              </div>
            </div>
            
            <div className="animate-float absolute -top-3 right-2 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-lg lg:flex"><Bot className="h-3.5 w-3.5 text-violet-600" /><span className="text-xs font-medium text-slate-700">Agent IA • en attente</span></div>
          </div>
        </div>
      </section>
      {/* LES RÔLES */}
      <section id="roles" className="bg-white py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Les rôles</p>
            <h2 className="mt-4 text-2xl font-[700] leading-[1.15] tracking-[-0.025em] text-[#0B0E17] sm:text-3xl lg:text-[34px]">Trois rôles, des responsabilités clairement délimitées</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">Chaque acteur agit dans son périmètre : le testeur signale, le développeur corrige avec l’IA, le chef de projet pilote.</p>
          </div>
          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 lg:gap-6">
            {roles.map((r, i) => (
              <div key={r.title} className={`reveal d${i + 1} group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 sm:p-6 lg:p-7 transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.14)] hover:border-slate-300`}>
                <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-[#0B0E17] text-white shadow-sm"><r.icon className="h-5 w-5" /></span>
                <h3 className="relative mt-4 sm:mt-5 text-[15px] sm:text-[16px] font-[650] tracking-[-0.015em] text-[#0B0E17]">{r.title}</h3>
                <p className="relative mt-2 text-[13.5px] sm:text-[14px] leading-[1.6] text-slate-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="bg-slate-50 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-600">Fonctionnalités</p>
            <h2 className="mt-3 text-2xl font-[700] leading-[1.15] tracking-[-0.025em] text-[#0B0E17] sm:text-3xl lg:text-[34px]">Tout ce qu’il faut pour corriger sans perdre le contrôle</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">De la déclaration d’une anomalie à la Pull Request validée, chaque étape est centralisée, tracée, et supervisée par un humain.</p>
          </div>
          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-5">
            {features.map((f, i) => (
              <div key={f.title} className={`reveal d${(i % 3) + 1} group rounded-xl border border-slate-200 bg-white p-5 sm:p-6 transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.12)]`}>
                <span className={`inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg shadow-sm ${i % 2 === 0 ? "bg-[#0B0E17] text-white" : "bg-emerald-500 text-white"}`}><f.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 sm:mt-5 text-[15px] font-[650] tracking-[-0.01em] text-[#0B0E17]">{f.title}</h3>
                <p className="mt-2 text-[13.5px] sm:text-[14px] leading-[1.6] text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="bg-white py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-600">Comment ça marche</p>
            <h2 className="mt-3 text-2xl font-[700] leading-[1.15] tracking-[-0.025em] text-[#0B0E17] sm:text-3xl lg:text-[34px]">Du signalement à la Pull Request, en 5 étapes</h2>
          </div>
          <div className="relative mt-8 sm:mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 sm:gap-8 lg:gap-6">
            <div className="pointer-events-none absolute left-[6%] right-[6%] top-6 hidden border-t border-dashed border-slate-200 lg:block" />
            {steps.map((s, i) => (
              <div key={s.n} className={`reveal d${(i % 6) + 1} relative`}>
                <span className="relative z-10 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-slate-200 bg-white font-mono text-sm font-[600] tracking-tight text-[#0B0E17] shadow-sm">{s.n}</span>
                <h3 className="mt-4 text-[15px] sm:text-[16px] font-[650] tracking-[-0.01em] text-[#0B0E17]">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] sm:text-[14px] leading-[1.6] text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI FIXBUG */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-8 lg:gap-10">
            {[
              { icon: ShieldCheck, title: "Sécurisé", desc: "Authentification classique et OAuth GitHub, droits d’accès par rôle, chiffrement des mots de passe et des tokens sensibles." },
              { icon: UserCheck, title: "Sous contrôle", desc: "L’IA n’agit jamais seule : elle attend une demande explicite et une validation avant tout envoi vers GitHub." },
              { icon: Users, title: "Collaboratif", desc: "Testeurs, développeurs et chefs de projet travaillent ensemble, avec des invitations simples et un suivi partagé." },
            ].map((item, idx) => (
              <div key={item.title} className={`reveal d${idx + 1} flex gap-4 sm:block`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-[#0B0E17]"><item.icon className="h-5 w-5" /></span>
                <div className="min-w-0"><h3 className="text-[16px] font-[650] tracking-[-0.01em] text-[#0B0E17] sm:mt-4">{item.title}</h3><p className="mt-1.5 text-[13.5px] sm:text-[14px] leading-[1.6] text-slate-600">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden bg-[#0B0E17] py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-full max-w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[70px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-violet-500/10 blur-[60px]" />
        <div className="reveal relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-[700] leading-[1.15] tracking-[-0.025em] text-white sm:text-3xl lg:text-[36px]">Prêt à corriger vos bugs </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">Créez votre projet, laissez vos développeurs superviser l’IA à chaque étape.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/inscription" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-[14px] font-[650] tracking-[-0.01em] text-[#0B0E17] shadow-lg transition-all hover:bg-slate-100">Créer un compte  <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/connexion" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3.5 text-[14px] font-[600] tracking-[-0.01em] text-white backdrop-blur transition-colors hover:bg-white/10 hover:border-white/20">Se connecter</Link>
          </div>
         
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 sm:py-12 lg:py-14 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1.5fr_0.8fr_0.8fr] sm:gap-8">
            <div>
              <Logo />
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-slate-500">La plateforme qui relie testeurs, développeurs, chefs de projet et un agent IA supervisé à votre dépôt GitHub.</p>
              <div className="mt-4 flex items-center gap-3 text-slate-500"><a href="#" aria-label="GitHub" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-[#0B0E17] transition-colors"><IconeGithub className="h-4 w-4" /></a></div>
            </div>
            <div><p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Produit</p><ul className="mt-4 space-y-2.5 text-sm text-slate-600"><li><a href="#fonctionnalites" className="hover:text-[#0B0E17] hover:underline underline-offset-4">Fonctionnalités</a></li><li><a href="#comment-ca-marche" className="hover:text-[#0B0E17] hover:underline underline-offset-4">Comment ça marche</a></li><li><a href="#roles" className="hover:text-[#0B0E17] hover:underline underline-offset-4">Les rôles</a></li></ul></div>
            <div><p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Compte</p><ul className="mt-4 space-y-2.5 text-sm text-slate-600"><li><Link href="/inscription" className="hover:text-[#0B0E17] hover:underline underline-offset-4">Inscription</Link></li><li><Link href="/connexion" className="hover:text-[#0B0E17] hover:underline underline-offset-4">Connexion</Link></li></ul></div>
          </div>
          <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row"><p className="text-xs text-slate-500 text-center sm:text-left">© {new Date().getFullYear()} FixBug. Tous droits réservés.</p><p className="text-xs text-slate-400 text-center">Conçu pour les équipes qui livrent avec confiance.</p></div>
        </div>
      </footer>
    </div>
  );
}
