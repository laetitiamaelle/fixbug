"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { apiFetch } from "@/lib/api";
import { construireArborescenceWebContainer } from "@/lib/construire-arborescence";

let webcontainerInstancePromise: Promise<WebContainer> | null = null;
export function getWebContainerInstance() {
  if (!webcontainerInstancePromise) {
    webcontainerInstancePromise = WebContainer.boot();
  }
  return webcontainerInstancePromise;
}

export default function EspaceTravailPage() {
  const params = useParams();
  const [statut, setStatut] = useState("⏳ Récupération des fichiers depuis GitHub...");
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const dejaLance = useRef(false);

  useEffect(() => {
    if (dejaLance.current) return;
    dejaLance.current = true;

    const terminal = new Terminal({ convertEol: true, fontSize: 13, theme: { background: "#0f172a" } });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      fitAddon.fit();
    }

    async function demarrer() {
      // NOUVEAU : on va chercher les VRAIS fichiers du bug, via notre backend
      const fichiers = await apiFetch(`/bugs/${params.id}/fichiers`);
      setStatut(`📦 ${fichiers.length} fichiers récupérés — construction de l'arborescence...`);

      const arborescence = construireArborescenceWebContainer(fichiers);

      const instance = await getWebContainerInstance();
      setStatut("🔧 Montage dans WebContainer...");
      await instance.mount(arborescence);

      setStatut("📥 Installation des dépendances (npm install)...");
      const install = await instance.spawn("npm", ["install"]);
      install.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));
      await install.exit;

      setStatut("🚀 Démarrage du serveur de développement...");
      const dev = await instance.spawn("npm", ["run", "dev"]);
      dev.output.pipeTo(new WritableStream({ write: (d) => terminal.write(d) }));

      instance.on("server-ready", (port, url) => {
        setStatut("✅ Environnement prêt !");
        setUrlPreview(url);
      });
    }

    demarrer().catch((err) => {
      console.error(err);
      setStatut("❌ Erreur : " + (err instanceof Error ? err.message : String(err)));
    });
  }, [params.id]);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-lg font-bold">Espace de travail — Bug #{params.id}</h1>
      <p>{statut}</p>
      <div ref={terminalRef} className="h-60 overflow-hidden rounded" />
      {urlPreview && (
        <div>
          <p className="mb-2 text-sm text-slate-500">Aperçu live :</p>
          <iframe src={urlPreview} className="h-96 w-full rounded border" />
        </div>
      )}
    </div>
  );
}