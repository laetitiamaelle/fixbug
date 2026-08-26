"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type NotifItem = { id: number; titre: string; contenu: string; lue: boolean; dateEnvoie: string };

type NotificationsContextType = {
  notifications: NotifItem[] | null;
  nonLues: number;
  rafraichir: () => Promise<void>;
  marquerToutesLues: () => Promise<void>;
  marquerLue: (id: number) => Promise<void>;
  supprimer: (id: number) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { utilisateur } = useAuth();
  const [notifications, setNotifications] = useState<NotifItem[] | null>(null);

  const rafraichir = useCallback(async () => {
    if (!utilisateur) { setNotifications(null); return; }
    try {
      const data = await apiFetch("/notifications");
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }, [utilisateur]);

  useEffect(() => { rafraichir(); }, [rafraichir]);

  async function marquerToutesLues() {
    await apiFetch("/notifications/tout-marquer-lu", { method: "PATCH" });
    setNotifications((prev) => prev?.map((n) => ({ ...n, lue: true })) ?? null);
  }

  async function marquerLue(id: number) {
    await apiFetch(`/notifications/${id}/lue`, { method: "PATCH" });
    setNotifications((prev) => prev?.map((n) => n.id === id ? { ...n, lue: true } : n) ?? null);
  }

  async function supprimer(id: number) {
    await apiFetch(`/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev?.filter((n) => n.id !== id) ?? null);
  }

  const nonLues = notifications?.filter((n) => !n.lue).length ?? 0;

  return (
    <NotificationsContext.Provider value={{ notifications, nonLues, rafraichir, marquerToutesLues, marquerLue, supprimer }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications doit être utilisé à l'intérieur de NotificationsProvider");
  return ctx;
}
