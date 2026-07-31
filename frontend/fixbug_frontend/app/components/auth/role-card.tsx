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
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-slate-900 bg-white shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-slate-900" : "bg-slate-100"
        )}
      >
        <Icon className={cn("h-4 w-4", selected ? "text-white" : "text-slate-500")} />
      </span>

      <span className="flex-1">
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-slate-500">
          {description}
        </span>
      </span>

      <CheckCircle2
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          selected ? "text-slate-900" : "text-slate-200"
        )}
      />
    </button>
  );
}
