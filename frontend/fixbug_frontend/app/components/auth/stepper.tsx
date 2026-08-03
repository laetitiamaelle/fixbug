import { cn } from "@/lib/utils";

interface StepperProps {
  current: 1 | 2;
}

export function Stepper({ current }: StepperProps) {
  const steps = [
    { n: 1, label: "choix du role" },
    { n: 2, label: "Incrisption" },
  ];

  return (
    <div className="flex items-center gap-3">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                current >= step.n
                  ? "bg-[#00D08C] text-white"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {step.n}
            </span>
            <span
              className={cn(
                "text-sm",
                current >= step.n ? "text-slate-900" : "text-slate-400"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}
