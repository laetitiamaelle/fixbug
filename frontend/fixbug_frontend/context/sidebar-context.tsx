"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type SidebarContextType = {
  ouvert: boolean;
  ouvrir: () => void;
  fermer: () => void;
  basculer: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider
      value={{
        ouvert,
        ouvrir: () => setOuvert(true),
        fermer: () => setOuvert(false),
        basculer: () => setOuvert((v) => !v),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar doit être utilisé dans un SidebarProvider");
  return ctx;
}