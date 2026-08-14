"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 ,EyeOff,Eye,User} from "lucide-react";

const labelsRole: Record<string, string> = {
  TESTEUR: "Testeur",
  CHEF_PROJET: "Chef de projet",
  ADMINISTRATEUR: "Administrateur",
};

export default function ParametresPage() {
  const { utilisateur, rafraichir } = useAuth();

  if (!utilisateur) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        
        <h1 className="text-2xl font-bold text-[#12151F]"> <User/> Profil</h1>
        <p className="text-sm text-slate-500">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      <EnTeteProfil utilisateur={utilisateur} />
      <FormulaireInformations utilisateur={utilisateur} onSucces={rafraichir} />
      <FormulaireMotDePasse />
    </div>
  );
}

function EnTeteProfil({ utilisateur }: { utilisateur: { nom: string; prenom: string; email: string; role: string } }) {
  const initiales = `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase();
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#12151F] text-lg font-semibold text-white">
        {initiales}
      </div>
      <div>
        <p className="font-semibold text-[#12151F]">
          {utilisateur.prenom} {utilisateur.nom}
        </p>
        <p className="text-sm text-slate-500">{labelsRole[utilisateur.role]}</p>
      </div>
    </div>
  );
}

function FormulaireInformations({
  utilisateur,
  onSucces,
}: {
  utilisateur: { nom: string; prenom: string; email: string };
  onSucces: () => Promise<void>;
}) {
  const [nom, setNom] = useState(utilisateur.nom);
  const [prenom, setPrenom] = useState(utilisateur.prenom);
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setNom(utilisateur.nom);
    setPrenom(utilisateur.prenom);
  }, [utilisateur]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setSucces(false);
    setChargement(true);
    try {
      await apiFetch("/users/profil", {
        method: "PATCH",
        body: JSON.stringify({ nom, prenom }),
      });
      await onSucces(); 
      setSucces(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setChargement(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-[#12151F]">Informations personnelles</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={utilisateur.email} disabled className="bg-slate-50 text-slate-500" />
        <p className="text-xs text-slate-400">L'email ne peut pas être modifié </p>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      {succes && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Informations mises à jour avec succès.
        </p>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button type="submit" disabled={chargement} className="bg-[#12151F] hover:bg-[#12151F]/90">
          {chargement ? "Enregistrement..." : "modifier"}
        </Button>
      </div>
    </form>
  );
}

function FormulaireMotDePasse() {
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");
  const [afficherNouveau, setAfficherNouveau] = useState(false);
  const [afficherConfirmation, setAfficherConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setSucces(false);

    if (nouveauMotDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (nouveauMotDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setChargement(true);
    try {
      await apiFetch("/users/profil", {
        method: "PATCH",
        body: JSON.stringify({ motdepasse: nouveauMotDePasse }),
      });
      setNouveauMotDePasse("");
      setConfirmation("");
      setSucces(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setChargement(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-[#12151F]">Changer le mot de passe</h2>

      <div className="space-y-2">
        <Label htmlFor="nouveauMotDePasse">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="nouveauMotDePasse"
            type={afficherNouveau ? "text" : "password"}
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            minLength={8}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setAfficherNouveau((v) => !v)}
            className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
            tabIndex={-1}
            aria-label={afficherNouveau ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {afficherNouveau ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmation">Confirmer le nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmation"
            type={afficherConfirmation ? "text" : "password"}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setAfficherConfirmation((v) => !v)}
            className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
            tabIndex={-1}
            aria-label={afficherConfirmation ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {afficherConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      {succes && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Mot de passe modifié avec succès.
        </p>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button type="submit" disabled={chargement} className="bg-[#12151F] hover:bg-[#12151F]/90">
          {chargement ? "Modification..." : "Changer le mot de passe"}
        </Button>
      </div>
    </form>
  );
}