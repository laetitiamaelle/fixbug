// components/file-tree.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Folder, FolderOpen, FileCode2, FileJson, FileText, FileImage,
  FileType2, Search, X,
} from "lucide-react";
import { NoeudArbre, construireArbreAffichage } from "@/lib/construire-arbre-affichage";

function iconePourFichier(nom: string) {
  const ext = nom.split(".").pop()?.toLowerCase();
  if (["ts", "tsx", "js", "jsx"].includes(ext ?? "")) return { Icone: FileCode2, couleur: "text-blue-500" };
  if (ext === "json") return { Icone: FileJson, couleur: "text-amber-500" };
  if (["md", "txt"].includes(ext ?? "")) return { Icone: FileText, couleur: "text-slate-400" };
  if (["png", "jpg", "jpeg", "svg", "ico", "gif"].includes(ext ?? "")) return { Icone: FileImage, couleur: "text-purple-500" };
  if (["css", "scss"].includes(ext ?? "")) return { Icone: FileType2, couleur: "text-sky-500" };
  return { Icone: FileText, couleur: "text-slate-400" };
}

function LigneDossier({
  noeud, profondeur, fichierActif, onSelect, fichiersModifies, ouvertsParDefaut,
}: {
  noeud: Extract<NoeudArbre, { type: "dossier" }>;
  profondeur: number;
  fichierActif: string | null;
  onSelect: (chemin: string) => void;
  fichiersModifies: Set<string>;
  ouvertsParDefaut: Set<string>;
}) {
  const [ouvert, setOuvert] = useState(
    ouvertsParDefaut.has(noeud.chemin) || profondeur < 1, // premier niveau ouvert par défaut
  );
  const IconeDossier = ouvert ? FolderOpen : Folder;

  return (
    <div>
      <button
        onClick={() => setOuvert((v) => !v)}
        style={{ paddingLeft: `${8 + profondeur * 14}px` }}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs text-slate-600 hover:bg-slate-100"
      >
        <IconeDossier className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{noeud.nom}</span>
      </button>
      {ouvert && (
        <div>
          {noeud.enfants.map((enfant) => (
            <NoeudLigne
              key={enfant.chemin}
              noeud={enfant}
              profondeur={profondeur + 1}
              fichierActif={fichierActif}
              onSelect={onSelect}
              fichiersModifies={fichiersModifies}
              ouvertsParDefaut={ouvertsParDefaut}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoeudLigne(props: {
  noeud: NoeudArbre; profondeur: number; fichierActif: string | null;
  onSelect: (chemin: string) => void; fichiersModifies: Set<string>; ouvertsParDefaut: Set<string>;
}) {
  const { noeud, profondeur, fichierActif, onSelect, fichiersModifies } = props;

  if (noeud.type === "dossier") return <LigneDossier {...props} noeud={noeud} />;

  const { Icone, couleur } = iconePourFichier(noeud.nom);
  const actif = fichierActif === noeud.chemin;
  const modifie = fichiersModifies.has(noeud.chemin);

  return (
    <button
      onClick={() => onSelect(noeud.chemin)}
      style={{ paddingLeft: `${8 + profondeur * 14}px` }}
      className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors ${
        actif ? "bg-white font-medium text-[#12151F] shadow-sm" : "text-slate-500 hover:bg-white/70"
      }`}
    >
      <Icone className={`h-3.5 w-3.5 shrink-0 ${couleur}`} />
      <span className="truncate">{noeud.nom}</span>
      {modifie && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
    </button>
  );
}

export function FileTree({
  fichiers, fichierActif, onSelect, fichiersModifies,
}: {
  fichiers: string[]; fichierActif: string | null; onSelect: (chemin: string) => void; fichiersModifies: Set<string>;
}) {
  const [recherche, setRecherche] = useState("");

  const arbre = useMemo(() => construireArbreAffichage(fichiers), [fichiers]);

  // En recherche : liste plate des chemins qui matchent, avec les dossiers parents forcés ouverts
  const cheminsFiltres = useMemo(() => {
    if (!recherche.trim()) return null;
    const terme = recherche.toLowerCase();
    return fichiers.filter((c) => c.toLowerCase().includes(terme));
  }, [recherche, fichiers]);

  const dossiersParentsAOuvrir = useMemo(() => {
    if (!cheminsFiltres) return new Set<string>();
    const set = new Set<string>();
    cheminsFiltres.forEach((chemin) => {
      const segments = chemin.split("/");
      let partiel = "";
      segments.slice(0, -1).forEach((s) => { partiel = partiel ? `${partiel}/${s}` : s; set.add(partiel); });
    });
    return set;
  }, [cheminsFiltres]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative border-b border-slate-100 p-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un fichier..."
          className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-7 pr-6 text-xs outline-none focus:border-[#12151F]"
        />
        {recherche && (
          <button onClick={() => setRecherche("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {cheminsFiltres ? (
          cheminsFiltres.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-slate-400">Aucun résultat</p>
          ) : (
            cheminsFiltres.map((chemin) => {
              const nom = chemin.split("/").pop()!;
              const { Icone, couleur } = iconePourFichier(nom);
              return (
                <button
                  key={chemin}
                  onClick={() => onSelect(chemin)}
                  className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs ${
                    fichierActif === chemin ? "bg-white font-medium text-[#12151F] shadow-sm" : "text-slate-500 hover:bg-white/70"
                  }`}
                >
                  <Icone className={`h-3.5 w-3.5 shrink-0 ${couleur}`} />
                  <span className="truncate">{chemin}</span>
                </button>
              );
            })
          )
        ) : (
          arbre.map((noeud) => (
            <NoeudLigne
              key={noeud.chemin}
              noeud={noeud}
              profondeur={0}
              fichierActif={fichierActif}
              onSelect={onSelect}
              fichiersModifies={fichiersModifies}
              ouvertsParDefaut={dossiersParentsAOuvrir}
            />
          ))
        )}
      </div>
    </div>
  );
}