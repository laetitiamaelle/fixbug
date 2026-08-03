"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const data = [
  { day: "Lun", detectes: 22, resolus: 28 },
  { day: "Mar", detectes: 30, resolus: 34 },
  { day: "Mer", detectes: 34, resolus: 20 },
  { day: "Jeu", detectes: 22, resolus: 25 },
  { day: "Ven", detectes: 18, resolus: 35 },
  { day: "Sam", detectes: 25, resolus: 37 },
  { day: "Dim", detectes: 32, resolus: 28 },
];

export function WeeklyActivityChart() {
  return (
    <Card className="border-slate-100">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">
              Activité Hebdomadaire
            </h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
            <Calendar className="h-3.5 w-3.5" />
            7 Derniers Jours
          </span>
        </div>

        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="detectesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="detectes"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#detectesGradient)"
              />
              <Area
                type="monotone"
                dataKey="resolus"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#resolusGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Bugs Détectés
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Bugs Résolus
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
