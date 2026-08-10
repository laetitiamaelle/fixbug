"use client";

import { useState, KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function NouveauProjetPage() {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [lienGithub, setLienGithub] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [technoEnCours, setTechnoEnCours] = useState("");
  const [chargement, setChargement] = useState(false);

  function ajouterTechnologie() {
    const valeur = technoEnCours.trim();
    if (valeur && !technologies.includes(valeur)) {
      setTechnologies([...technologies, valeur]);
    }
    setTechnoEnCours("");
  }

  function gererTouche(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      ajouterTechnologie();
    }
  }

  function retirerTechnologie(tech: string) {
    setTechnologies(technologies.filter((t) => t !== tech));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    // TODO: brancher POST /projets ici
    console.log({ nom, description, lienGithub, technologies });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/projets" className="mb-4 flex items-center gap-1 text-sm text-brand-slate hover:text-brand-ink">
        <ArrowLeft className="h-4 w-4" /> Retour aux projets
      </Link>

      <h1 className="text-2xl font-bold text-brand-ink">Créer un nouveau projet</h1>
      <p className="mb-6 text-sm text-brand-slate">
        Configurez les informations de base de votre nouveau projet Fixbug.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du projet</Label>
          <Input
            id="nom"
            placeholder="ex: Système de Paiement v2"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Décrivez brièvement les objectifs et le contexte de ce projet..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lienGithub">Dépôt GitHub</Label>
          <div className="relative">
            <FaGithub className="h-4 w-4" />
            <Input
              id="lienGithub"
              placeholder="https://github.com/utilisateur/depot"
              className="pl-9"
              value={lienGithub}
              onChange={(e) => setLienGithub(e.target.value)}
            />
          </div>
          <p className="text-xs text-brand-slate">
            L&apos;agent IA utilisera ce dépôt pour analyser et corriger les bugs signalés.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="technologies">Technologies & Frameworks</Label>
          {technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 rounded-md border bg-slate-50 p-2">
              {technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="gap-1 font-normal">
                  {tech}
                  <button type="button" onClick={() => retirerTechnologie(tech)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              id="technologies"
              placeholder="ex: Docker, Redis..."
              value={technoEnCours}
              onChange={(e) => setTechnoEnCours(e.target.value)}
              onKeyDown={gererTouche}
            />
            <Button type="button" variant="outline" onClick={ajouterTechnologie}>
              Ajouter
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" >
            <Link href="/projets">Annuler</Link>
          </Button>
          <Button type="submit" disabled={chargement} className="bg-brand-ink hover:bg-brand-ink/90">
            {chargement ? "Création..." : "Créer le projet"}
          </Button>
        </div>
      </form>
    </div>
  );
}