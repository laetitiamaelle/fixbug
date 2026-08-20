"use client";

import { useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

let webcontainerInstancePromise: Promise<WebContainer> | null = null;

export function getWebContainerInstance() {
  if (!webcontainerInstancePromise) {
    webcontainerInstancePromise = WebContainer.boot();
  }
  return webcontainerInstancePromise;
}

const fichiersDeTest = {
  "package.json": {
    file: {
      contents: JSON.stringify({
        name: "test-fixbug",
        type: "module",
        scripts: { start: "node server.js" },
      }),
    },
  },
  "server.js": {
    file: {
      contents: `
import http from 'http';
const serveur = http.createServer((req, res) => {
  res.end('Bonjour depuis WebContainer !');
});
serveur.listen(3111, () => console.log('Serveur prêt sur le port 3111'));
      `,
    },
  },
};

export default function TestWebcontainerPage() {
  const [statut, setStatut] = useState("⏳ Démarrage...");
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const dejaLance = useRef(false); // évite un double lancement (Strict Mode de React)

  useEffect(() => {
    if (dejaLance.current) return;
    dejaLance.current = true;

    // NOUVEAU : création du vrai terminal xterm.js
    const terminal = new Terminal({
      convertEol: true,
      fontSize: 13,
      theme: { background: "#0f172a" },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      fitAddon.fit();
    }

    async function lancerTest() {
      const instance = await getWebContainerInstance();
      setStatut("🟢 Actif — montage des fichiers...");

      await instance.mount(fichiersDeTest);
      setStatut("📦 Fichiers montés — installation...");

      const processusInstall = await instance.spawn("npm", ["install"]);
      // NOUVEAU : on écrit directement dans le terminal xterm, plus dans une div
      processusInstall.output.pipeTo(
        new WritableStream({
          write(donnee) {
            terminal.write(donnee);
          },
        }),
      );
      await processusInstall.exit;

      setStatut("🚀 Lancement du serveur...");

      const processusServeur = await instance.spawn("npm", ["start"]);
      processusServeur.output.pipeTo(
        new WritableStream({
          write(donnee) {
            terminal.write(donnee);
          },
        }),
      );

      instance.on("server-ready", (port, url) => {
        setStatut("✅ Serveur prêt !");
        setUrlPreview(url);
      });
    }

    lancerTest();
  }, []);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-lg font-bold">Test WebContainer — terminal xterm.js</h1>
      <p>{statut}</p>

      {/* NOUVEAU : conteneur du vrai terminal */}
      <div ref={terminalRef} className="h-60 overflow-hidden rounded" />

      {urlPreview && (
        <div>
          <p className="mb-2 text-sm text-slate-500">Aperçu live :</p>
          <iframe src={urlPreview} className="h-64 w-full rounded border" />
        </div>
      )}
    </div>
  );
}