"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api";

export default function ParametresProjetPage() {
  const params = useParams();
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [lienGithub, setLienGithub] = useState("");
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    apiFetch(`/projets/${params.id}`).then((p) => {
      setNom(p.nom);
      setDescription(p.description || "");
      setLienGithub(p.lienGithub || "");
    });
  }, [params.id]);

  async function handleEnregistrer(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setSucces(false);
    try {
      await apiFetch(`/projets/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ nom, description, lienGithub }),
      });
      setSucces(true);
    } finally {
      setChargement(false);
    }
  }

  async function handleSupprimer() {
    await apiFetch(`/projets/${params.id}`, { method: "DELETE" });
    router.push("/projets");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleEnregistrer} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-2"><Label htmlFor="nom">Nom du projet</Label><Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></div>
        <div className="space-y-2"><Label htmlFor="lienGithub">Dépôt GitHub</Label><Input id="lienGithub" value={lienGithub} onChange={(e) => setLienGithub(e.target.value)} /></div>
        {succes && <p className="text-sm text-emerald-600">Modifications enregistrées.</p>}
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" disabled={chargement} className="bg-[#12151F] hover:bg-[#12151F]/90">
            {chargement ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="mb-1 font-semibold text-red-700">Zone de danger</h3>
        <p className="mb-4 text-sm text-red-600">La suppression est irréversible et supprime tous les bugs associés.</p>
        <AlertDialog>
          {/* CORRIGÉ (Base UI) : render={<Button ... />} vide, le texte reste dans les enfants */}
          <AlertDialogTrigger render={<Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" />}>
            Supprimer ce projet
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleSupprimer} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}