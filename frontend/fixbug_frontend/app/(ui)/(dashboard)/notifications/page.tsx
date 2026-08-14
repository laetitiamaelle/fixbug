"use client";

import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/context/notifications-context";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { notifications, nonLues, marquerToutesLues, supprimer } = useNotifications();

  async function handleToutMarquer() {
    try {
      await marquerToutesLues();
    } catch {
      toast.error("une erreur est survenu");
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#12151F]">Notifications</h1>
            {nonLues > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">{nonLues}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">Votre historique de notifications.</p>
        </div>
        {nonLues > 0 && (
          <button onClick={handleToutMarquer} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-blue-200 px-3 py-2 text-xs font-medium text-blue-900 hover:border-slate-300 hover:bg-slate-50">
            <CheckCheck size={14} /> marquer comme lu
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {notifications === null ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3.5 border-b border-slate-100 p-5 last:border-0">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1"><Skeleton className="h-4 w-64" /><Skeleton className="mt-2 h-3 w-40" /></div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><BellOff size={20} className="text-slate-400" /></div>
            <p className="text-sm text-slate-500">Aucune notification pour l'instant.</p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div key={n.id} className={`group relative flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-slate-50 ${!n.lue ? "bg-blue-50/60" : ""} ${i !== notifications.length - 1 ? "border-b border-slate-100" : ""}`}>
              {!n.lue && <span className="absolute left-0 top-0 h-full w-0.5 bg-blue-600" />}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${!n.lue ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                <Bell size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${!n.lue ? "font-semibold text-[#12151F]" : "font-medium text-slate-700"}`}> <strong>{n.titre}</strong></p>
                <p className="mt-0.5 text-sm text-slate-500">{n.contenu}</p>
                <p className="mt-1.5 text-xs text-slate-400">{new Date(n.dateEnvoie).toLocaleString("fr-FR")}</p>
              </div>
              
              <button
                onClick={() => handleSupprimer(n.id)}
                className="rounded p-1.5 text-slate-300 opacity-0  bg-red-50 text-red-500 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}