import { LucideIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function RoleCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all duration-200",
        selected
          ? "border-emerald-500/30 bg-emerald-50/60 shadow-[0_0_0_3px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-px"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm transition-colors",
          selected ? "bg-[#0B0E17] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <span className="flex-1">
        <span className="block text-[14px] font-[650] tracking-[-0.01em] text-slate-900">
          {title}
        </span>
        <span className="mt-1 block text-[13px] leading-relaxed text-slate-600">
          {description}
        </span>
      </span>

      <CheckCircle2
        className={cn(
          "mt-1 h-5 w-5 shrink-0 transition-colors",
          selected ? "text-emerald-600 fill-emerald-600/15" : "text-slate-300"
        )}
      />
    </button>
  );
}
