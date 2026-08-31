import { Sparkles, ShieldCheck, Users } from "lucide-react";

export function SignupAside() {
  return (
    <div className="hidden h-full flex-col bg-slate-900 p-10 md:flex md:w-1/2 lg:p-14 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 -right-28 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-violet-500/10 blur-[80px]" />
      <div className="pointer-events-none absolute inset-0  bg-[size:28px_28px]" />

      <div className="relative flex items-center justify-end">
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
         
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-center py-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-slate-200">Plateforme collaborative</span>
        </div>
        <h2 className="mt-6 max-w-[520px] text-[28px] font-[700] leading-[1.15] tracking-[-0.025em] text-white lg:text-[32px]">
          Éliminez les bugs plus rapidement
        </h2>
        <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-slate-400">
          Notre IA analyse vos rapports pour suggérer des correctifs et prioriser les anomalies critiques en temps réel — toujours validé par un humain.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 max-w-[440px]">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Validation humaine obligatoire</p>
              <p className="text-xs leading-relaxed text-slate-400">Aucune PR sans relecture développeur.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-900">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">3 rôles, 1 workflow fluide</p>
              <p className="text-xs leading-relaxed text-slate-400">Testeur → Développeur + IA → Chef de projet.</p>
            </div>
          </div>
        </div>
      </div>

      <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} FixBug • Sécurisé & chiffré</p>
    </div>
  );
}
