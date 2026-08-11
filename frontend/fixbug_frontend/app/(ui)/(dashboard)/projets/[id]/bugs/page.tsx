"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bug, Clock, AlertCircle, CheckCircle2, XCircle, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

type BugItem = {
  id: number;
  titre: string | null;
  description: string;
  captures: string[];
  statut: "EN_COURS_DE_TRAITEMENT" | "EN_ATTENTE_VALIDATION" | "BLOQUE" | "RESOLU";
  createdAt: string;
  testeur: { nom: string; prenom: string };
};

const configStatut = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700" },
  EN_ATTENTE_VALIDATION: { label: "En attente de validation", icone: AlertCircle, classe: "bg-amber-50 text-amber-700" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700" },
  RESOLU: { label: "Résolu", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700" },
};

export default function BugsProjetPage() {
  const params = useParams();
  const [bugs, setBugs] = useState<BugItem[] | null>(null);
  const [filtre, setFiltre] = useState<string|null>("TOUS");
  const [bugSelectionne, setBugSelectionne] = useState<BugItem | null>(null);

  useEffect(() => {
    apiFetch(`/bugs?projetId=${params.id}`).then((data: BugItem[]) => {
      setBugs(data);
      if (data.length > 0) setBugSelectionne(data[0]); // sélectionne le premier par défaut
    }).catch(() => setBugs([]));
  }, [params.id]);

  const bugsFiltres = bugs?.filter((b) => filtre === "TOUS" || b.statut === filtre) ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* Liste des bugs */}
      <div>
        <div className="mb-4">
          <Select value={filtre} onValueChange={setFiltre}>
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOUS">Tous les statuts</SelectItem>
              <SelectItem value="EN_COURS_DE_TRAITEMENT">En traitement</SelectItem>
              <SelectItem value="EN_ATTENTE_VALIDATION">En attente de validation</SelectItem>
              <SelectItem value="BLOQUE">Bloqué</SelectItem>
              <SelectItem value="RESOLU">Résolu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {bugs === null ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-5"><Skeleton className="h-5 w-full" /></div>)
          ) : bugsFiltres.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Aucun bug pour ce filtre.</p>
          ) : (
            bugsFiltres.map((bug, i) => {
              const statut = configStatut[bug.statut];
              const Icone = statut.icone;
              const actif = bugSelectionne?.id === bug.id;
              return (
                <button
                  key={bug.id}
                  onClick={() => setBugSelectionne(bug)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
                    i !== bugsFiltres.length - 1 ? "border-b border-slate-200" : ""
                  } ${actif ? "bg-slate-50" : ""}`}
                >
                  <div>
                    <p className="font-medium text-[#12151F]">{bug.titre || "Sans titre"}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {bug.testeur.prenom} {bug.testeur.nom} · {new Date(bug.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge className={`gap-1.5 font-normal ${statut.classe}`}><Icone className="h-3.5 w-3.5" />{statut.label}</Badge>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Panneau détail : remplace le panneau "À propos" pour ce bug précis */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        {!bugSelectionne ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <Bug className="h-8 w-8" />
            <p className="text-sm">Sélectionnez un bug pour voir ses détails.</p>
          </div>
        ) : (
          <DetailBug bug={bugSelectionne} />
        )}
      </div>
    </div>
  );
}

function DetailBug({ bug }: { bug: BugItem }) {
  const statut = configStatut[bug.statut];
  const Icone = statut.icone;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-[#12151F]">{bug.titre || "Sans titre"}</h3>
        <Badge className={`gap-1.5 font-normal ${statut.classe}`}><Icone className="h-3.5 w-3.5" />{statut.label}</Badge>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase text-slate-400">Description</p>
        <p className="text-sm text-slate-600">{bug.description}</p>
      </div>

      {bug.captures.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-slate-400">Captures d&apos;écran</p>
          <div className="grid grid-cols-2 gap-2">
            {bug.captures.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-slate-200">
                <img src={url} alt={`Capture ${i + 1}`} className="h-20 w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
        <div className="flex justify-between"><span className="text-slate-400">Signalé par</span><span>{bug.testeur.prenom} {bug.testeur.nom}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Date</span><span>{new Date(bug.createdAt).toLocaleString("fr-FR")}</span></div>
      </div>
    </div>
  );
}