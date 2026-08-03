import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change: string;
  changeTone?: "positive" | "negative" | "neutral";
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeTone = "positive",
}: StatCardProps) {
  return (
    <Card className="border-slate-100">
      <CardContent className="px-5">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Icon className="h-5 w-5 text-emerald-600" />
          </span>
          <span
            className={cn(
              "text-sm font-medium",
              changeTone === "positive" && "text-emerald-600",
              changeTone === "negative" && "text-red-500",
              changeTone === "neutral" && "text-slate-400"
            )}
          >
            {change}
          </span>
        </div>

        <p className="mt-4 text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
