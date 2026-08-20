"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { IconeGithub } from "@/app/components/icone-github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Projet = {
  nom: string;
  description: string | null;
  liengit: string | null; // le champ Prisma s'appelle "liengit", pas "lienGithub"
};

export default function ParametresProjetPage() {
  const params = useParams();
  const router = useRouter();

  const [chargementInitial, setChargementInitial] = useState(true);
  const [valeursOriginales, setValeursOriginales] = useState({ nom: "", description: "", liengit: "" });

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [liengit, setLienGithub] = useState("");

  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  useEffect(() => {
    apiFetch(`/projets/${params.id}`)
      .then((p: Projet) => {
        setNom(p.nom);
        setDescription(p.description || "");
        setLienGithub(p.liengit || ""); // corrigé : "liengit", pas "lienGithub"
        setValeursOriginales({ nom: p.nom, description: p.description || "", liengit: p.liengit || "" });
      })
      .catch(() => toast.error("Impossible de charger les informations du projet"))
      .finally(() => setChargementInitial(false));
  }, [params.id]);

  const aDesModifications =
    nom !== valeursOriginales.nom ||
    description !== valeursOriginales.description ||
    liengit !== valeursOriginales.liengit;

  async function handleEnregistrer(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setSucces(false);
    try {
      // corrigé : le DTO backend attend la clé "lienGithub", pas "liengit"
      await apiFetch(`/projets/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ nom, description, lienGithub: liengit }),
      });
      setValeursOriginales({ nom, description, liengit });
      setSucces(true);
      toast.success("Modifications enregistrées");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setChargement(false);
    }
  }

  async function handleSupprimer() {
    setSuppressionEnCours(true);
    try {
      await apiFetch(`/projets/${params.id}`, { method: "DELETE" });
      toast.success("Projet supprimé");
      router.push("/projets");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setSuppressionEnCours(false);
    }
  }

  if (chargementInitial) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-base font-semibold text-slate-900">Paramètres du projet</h2>

      <form onSubmit={handleEnregistrer} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du projet</Label>
          <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lienGithub">Dépôt GitHub</Label>
          <div className="relative">
            <IconeGithub className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="lienGithub"
              value={liengit}
              onChange={(e) => setLienGithub(e.target.value)}
              placeholder="https://github.com/utilisateur/depot"
              className="pl-9"
            />
          </div>
        </div>

        {succes && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Modifications enregistrées.
          </p>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            type="submit"
            disabled={chargement || !aDesModifications}
            className="bg-[#12151F] hover:bg-[#12151F]/90 disabled:opacity-50"
          >
            {chargement ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50/60 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </span>
         
        </div>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" className="border-red-300 bg-white text-red-700 hover:bg-red-100" />}>
            Supprimer le projet
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Voulez-vous supprimer ce projet ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Tous les bugs, collaborateurs et invitations liés à ce projet seront définitivement supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSupprimer}
                disabled={suppressionEnCours}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {suppressionEnCours ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}