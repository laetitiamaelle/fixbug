import { TrendingUp, Search } from "lucide-react";

const quickActions = ["Rapport hebdo", "Top bugs", "Charge équipe"];

export function AiAssistantCard() {
  return (
    <div className="rounded-xl bg-slate-900 p-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
        <TrendingUp className="h-4 w-4 text-white" />
      </span>
      <p className="mt-4 text-xs font-semibold tracking-wide text-slate-400">
        ASSISTANT IA
      </p>
      <h3 className="mt-1 text-lg font-semibold leading-snug text-white">
        Comment puis-je vous aider ?
      </h3>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Résumer les bugs critiques..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action}
            className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
