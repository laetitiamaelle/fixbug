"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

type NotifItem = {
  id: number;
  titre: string;
  contenu: string;
  lue: boolean;
  dateEnvoie: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotifItem[] | null>(null);

  useEffect(() => {
    apiFetch("/notifications")
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#12151F]">Notifications</h1>
      <p className="mb-6 text-sm text-slate-500">Votre historique de notifications.</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {notifications === null ? (
          // Squelette pendant le chargement
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-slate-100 p-5 last:border-0">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Aucune notification pour l'instant.</p>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              className={`flex gap-3 px-5 py-4 ${!n.lue ? "bg-blue-50/50" : ""} ${
                i !== notifications.length - 1 ? "border-b border-slate-200" : ""
              }`}
            >
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-medium text-[#12151F]">{n.titre}</p>
                <p className="text-sm text-slate-500">{n.contenu}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(n.dateEnvoie).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}