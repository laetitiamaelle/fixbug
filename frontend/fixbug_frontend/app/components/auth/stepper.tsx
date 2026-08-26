import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
  current: 1 | 2;
}

export function Stepper({ current }: StepperProps) {
  const steps = [
    { n: 1, label: "Choix du rôle" },
    { n: 2, label: "Inscription" },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const active = current >= step.n;
        const completed = current > step.n;
        return (
          <div key={step.n} className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-[700] tracking-tight shadow-sm ring-1 transition-colors",
                  active
                    ? "bg-[#0B0E17] text-white ring-[#0B0E17]"
                    : "bg-white text-slate-400 ring-slate-200",
                  completed && "bg-emerald-500 text-white ring-emerald-500"
                )}
              >
                {completed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.n}
              </span>
              <span
                className={cn(
                  "text-[13px] font-[600] tracking-[-0.01em]",
                  active ? "text-slate-900" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "ml-1 h-px w-10 transition-colors",
                  current > 1 ? "bg-emerald-300" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
