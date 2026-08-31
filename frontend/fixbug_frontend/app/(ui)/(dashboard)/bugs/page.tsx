"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Clock, CheckCircle2, XCircle, UserCheck, ArrowRight, ChevronDown, ExternalLink, Search, Filter, Bug, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BugItem = {
  id: number;
  titre: string | null;
  description: string;
  captures: string[];
  statut: string;
  createdAt: string;
  projetId: number;
  numeroPR: number | null; // NOUVEAU
  urlPR: string | null;    // NOUVEAU
  testeur: { nom: string; prenom: string };
  developpeur: { id: number; nom: string; prenom: string } | null;
  projet: { nom: string };
};

const configStatut: Record<string, { label: string; icone: React.ElementType; classe: string }> = {
  EN_COURS_DE_TRAITEMENT: { label: "En traitement", icone: Clock, classe: "bg-blue-50 text-blue-700" },
  EN_ATTENTE_VALIDATION: { label: "En attente de validation", icone: AlertCircle, classe: "bg-amber-50 text-amber-700" },
  BLOQUE: { label: "Bloqué", icone: XCircle, classe: "bg-red-50 text-red-700" },
  RESOLU: { label: "Résolu", icone: CheckCircle2, classe: "bg-emerald-50 text-emerald-700" },
};

export default function TousLesBugsPage() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [bugs, setBugs] = useState<BugItem[] | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [bugDeplie, setBugDeplie] = useState<number | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<string>("TOUS");
  const [recherche, setRecherche] = useState("");

  const chargerBugs = useCallback(() => {
    apiFetch("/bugs").then(setBugs).catch(() => setBugs([]));
  }, []);
  useEffect(() => { chargerBugs(); }, [chargerBugs]);

  const estDeveloppeur = utilisateur?.role === "DEVELOPPEUR";

  async function handlePrendreEnCharge(bugId: number) {
    setEnCours(bugId);
    try {
      await apiFetch(`/bugs/${bugId}/prendre-en-charge`, { method: "PATCH" });
      toast.success("Bug pris en charge — direction votre espace de travail");
      router.push(`/bugs/${bugId}/espace-travail`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ce bug a déjà été pris en charge par quelqu'un d'autre");
      chargerBugs();
    } finally {
      setEnCours(null);
    }
  }

  const bugsFiltres = bugs?.filter(b => {
    const matchStatut = filtreStatut === "TOUS" || b.statut === filtreStatut;
    const matchRecherche = !recherche || (b.titre || "").toLowerCase().includes(recherche.toLowerCase()) || b.projet.nom.toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  }) ?? null;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/projets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#12151F] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12151F] text-white">
            <Bug className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#12151F]">
              {estDeveloppeur ? "Bugs à traiter" : "Suivi des bugs"}
            </h1>
            <p className="text-sm text-slate-500">
              {estDeveloppeur ? "Prenez en charge un bug pour commencer à le corriger." : "Tous les bugs signalés sur vos projets."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Rechercher un bug..." value={recherche} onChange={e => setRecherche(e.target.value)} className="pl-9 h-8 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={filtreStatut} onValueChange={(v) => setFiltreStatut(v ?? "TOUS")}>
              <SelectTrigger className="w-[200px] h-8 bg-white">
                <SelectValue placeholder="Filtrer par état" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUS">Tous les états</SelectItem>
                <SelectItem value="EN_COURS_DE_TRAITEMENT">En traitement</SelectItem>
                <SelectItem value="EN_ATTENTE_VALIDATION">En attente</SelectItem>
                <SelectItem value="BLOQUE">Bloqué</SelectItem>
                <SelectItem value="RESOLU">Résolu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {bugsFiltres && <span className="text-xs text-slate-500 hidden sm:inline">{bugsFiltres.length} résultat{bugsFiltres.length !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {bugs === null ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-5"><Skeleton className="h-5 w-full" /></div>)
        ) : bugsFiltres && bugsFiltres.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><Search className="h-6 w-6 text-slate-400" /></div>
            <p className="text-sm font-medium text-slate-900">Aucun bug trouvé</p>
            <p className="text-sm text-slate-500">{recherche || filtreStatut !== "TOUS" ? "Aucun bug ne correspond aux filtres." : "Aucun bug pour l'instant."}</p>
            {(recherche || filtreStatut !== "TOUS") && (
              <Button variant="outline" size="sm" onClick={() => { setRecherche(""); setFiltreStatut("TOUS"); }} className="mt-1">Réinitialiser les filtres</Button>
            )}
          </div>
        ) : bugs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Aucun bug pour l'instant.</p>
        ) : (
          (bugsFiltres ?? []).map((bug, i) => {
            const statut = configStatut[bug.statut];
            const Icone = statut.icone;
            const estPrisParMoi = bug.developpeur?.id === utilisateur?.id;
            const estDeplie = bugDeplie === bug.id;

            return (
              <div key={bug.id} className={i !== (bugsFiltres?.length ?? 0) - 1 ? "border-b border-slate-200" : ""}>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <button onClick={() => setBugDeplie(estDeplie ? null : bug.id)} className="flex flex-1 items-center gap-2 text-left">
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${estDeplie ? "rotate-180" : ""}`} />
                    <div>
                      <p className="font-medium text-[#12151F]">{bug.titre || "Sans titre"}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {bug.projet.nom} ·  declarer par {bug.testeur.prenom} {bug.testeur.nom} ·le : {new Date(bug.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {bug.developpeur && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <UserCheck className="h-3 w-3" /> Pris en charge par {bug.developpeur.prenom} {bug.developpeur.nom}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={`gap-1.5 font-normal ${statut.classe}`}>
                      <Icone className="h-3.5 w-3.5" />{statut.label}
                    </Badge>

                    {/*  lien vers la PR, visible pour tout le monde dès qu'elle existe */}
                    {bug.urlPR && (
                      <a
                        href={bug.urlPR}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        PR #{bug.numeroPR} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {/* Bug pas encore pris en charge → bouton "Prendre en charge" (Développeur uniquement) */}
                    {estDeveloppeur && !bug.developpeur && (
                      <Button size="sm" disabled={enCours === bug.id} onClick={() => handlePrendreEnCharge(bug.id)} className="bg-[#12151F] hover:bg-[#12151F]/90">
                        {enCours === bug.id ? "..." : "Prendre en charge"}
                      </Button>
                    )}

                    
                    {estDeveloppeur && estPrisParMoi && (
                      <Button size="sm" onClick={() => router.push(`/bugs/${bug.id}/espace-travail`)} className="bg-[#12151F] hover:bg-[#12151F]/90">
                        Ouvrir l'espace de travail <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {estDeplie && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                    <p className="mb-3 text-sm leading-relaxed text-slate-600">{bug.description}</p>
                    {bug.captures?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {bug.captures.map((url, j) => (
                          <a key={j} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-slate-200">
                            <img src={url} alt={`Capture ${j + 1}`} className="h-20 w-28 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Aucune capture jointe.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}