"use client";

import { useState, useMemo } from "react";
import { Bell, BellOff, CheckCheck, Trash2, Search, Filter, Clock, Inbox, Check, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/context/notifications-context";
import { toast } from "sonner";

type Filtre = "toutes" | "non-lues" | "lues";

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const { notifications, nonLues, marquerToutesLues, marquerLue, supprimer } = useNotifications();
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [recherche, setRecherche] = useState("");

  async function handleToutMarquer() {
    try {
      await marquerToutesLues();
      toast.success("Toutes les notifications marquées comme lues");
    } catch {
      toast.error("Une erreur est survenue");
    }
  }

  async function handleMarquerLue(id: number) {
    try {
      await marquerLue(id);
    } catch {
      toast.error("Impossible de marquer comme lue");
    }
  }

  async function handleSupprimer(id: number) {
    try {
      await supprimer(id);
      toast.success("Notification supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  const stats = useMemo(() => {
    const total = notifications?.length ?? 0;
    const lues = total - nonLues;
    return { total, nonLues, lues };
  }, [notifications, nonLues]);

  const filtrees = useMemo(() => {
    if (!notifications) return null;
    return notifications.filter((n) => {
      const matchFiltre = filtre === "toutes" ? true : filtre === "non-lues" ? !n.lue : n.lue;
      const matchSearch = !recherche || n.titre.toLowerCase().includes(recherche.toLowerCase()) || n.contenu.toLowerCase().includes(recherche.toLowerCase());
      return matchFiltre && matchSearch;
    });
  }, [notifications, filtre, recherche]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0E17] text-white shadow-sm">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="flex items-center gap-2.5 text-xl sm:text-2xl font-[700] tracking-[-0.02em] text-[#0B0E17]">
                  Notifications
                  {nonLues > 0 && (
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-[700] text-white shadow-sm">
                      {nonLues}
                    </span>
                  )}
                </h1>
                <p className="text-[13px] sm:text-sm text-slate-500">Restez à jour sur l’activité de vos projets et collaborations.</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToutMarquer}
              disabled={nonLues === 0 || !notifications}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-4 !py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
                <p className="mt-1 text-xl sm:text-2xl font-[700] tracking-tight text-[#0B0E17]">{notifications === null ? "--" : stats.total}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Inbox className="h-4 w-4" />
              </span>
            </div>
          </Card>
          <Card className="p-4 !py-4 border-amber-200/50 bg-amber-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Non lues</p>
                <p className="mt-1 text-xl sm:text-2xl font-[700] tracking-tight text-amber-700">{notifications === null ? "--" : stats.nonLues}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
          </Card>
          <Card className="p-4 !py-4 border-emerald-200/50 bg-emerald-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Lues</p>
                <p className="mt-1 text-xl sm:text-2xl font-[700] tracking-tight text-emerald-700">{notifications === null ? "--" : stats.lues}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Check className="h-4 w-4" />
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-4 p-3 sm:p-4 !py-3 !gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 w-fit">
            {[
              { key: "toutes", label: "Toutes" },
              { key: "non-lues", label: "Non lues" },
              { key: "lues", label: "Lues" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFiltre(tab.key as Filtre)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-[600] transition-all ${filtre === tab.key ? "bg-white text-[#0B0E17] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {tab.label}
                {tab.key === "non-lues" && nonLues > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{nonLues}</span>
                )}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher une notification..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden !py-0 !gap-0">
        {notifications === null ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3.5 p-4 sm:p-5">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtrees && filtrees.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              {filtre === "non-lues" ? <CheckCheck className="h-7 w-7 text-slate-400" /> : recherche ? <Search className="h-7 w-7 text-slate-400" /> : <BellOff className="h-7 w-7 text-slate-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {recherche ? "Aucun résultat" : filtre === "non-lues" ? "Aucune notification non lue" : filtre === "lues" ? "Aucune notification lue" : "Aucune notification"}
              </p>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
                {recherche ? `Aucune notification ne correspond à "${recherche}".` : "Vous êtes à jour ! Les nouvelles notifications apparaîtront ici."}
              </p>
            </div>
            {recherche && (
              <Button variant="outline" size="sm" onClick={() => setRecherche("")}>Effacer la recherche</Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtrees!.map((n) => (
              <div
                key={n.id}
                className={`group relative flex items-start gap-3.5 px-4 py-4 sm:px-5 transition-colors hover:bg-slate-50/80 ${!n.lue ? "bg-amber-50/40 hover:bg-amber-50/60" : "bg-white"}`}
              >
                {!n.lue && <span className="absolute left-0 top-0 h-full w-[3px] bg-amber-500" />}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${!n.lue ? "bg-[#0B0E17] text-white" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                  <Bell className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <p className={`text-[14px] leading-tight ${!n.lue ? "font-[650] text-[#0B0E17]" : "font-[500] text-slate-800"}`}>
                      {n.titre}
                    </p>
                    {!n.lue && <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[11px] px-1.5 py-0">Nouveau</Badge>}
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600 line-clamp-2">{n.contenu}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {formatRelative(n.dateEnvoie)}
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span>{new Date(n.dateEnvoie).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {!n.lue && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleMarquerLue(n.id)}
                      className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                      title="Marquer comme lu"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleSupprimer(n.id)}
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {filtrees && filtrees.length > 0 && (
        <p className="mt-4 text-center text-xs text-slate-400">
          {filtrees.length} notification{filtrees.length > 1 ? "s" : ""} {filtre !== "toutes" ? `• filtre : ${filtre}` : ""} • Mis à jour à l’instant
        </p>
      )}
    </div>
  );
}
