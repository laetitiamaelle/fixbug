"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  EyeOff,
  Eye,
  User,
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  Mail,
} from "lucide-react";

const ROLE_META: Record<string, { label: string; badge: string; ring: string }> = {
  TESTEUR: {
    label: "Testeur",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    ring: "from-sky-500 to-sky-700",
  },
  DEVELOPPEUR:{
    label: "Developpeur",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    ring: "from-sky-500 to-sky-700",
  },
  CHEF_PROJET: {
    label: "Chef de projet",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
    ring: "from-violet-500 to-violet-700",
  },
  ADMINISTRATEUR: {
    label: "Administrateur",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    ring: "from-[#12151F] to-[#3A4054]",
  },
};

export default function ParametresPage() {
  const { utilisateur, rafraichir } = useAuth();

  if (!utilisateur) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12151F] text-white">
            <User className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#12151F]">
            Profil
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Gérez vos informations personnelles et votre sécurité.
        </p>
      </div>

      <EnTeteProfil utilisateur={utilisateur} />
      <FormulaireInformations utilisateur={utilisateur} onSucces={rafraichir} />
      <FormulaireMotDePasse />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* En-tête                                                            */
/* ---------------------------------------------------------------- */

function EnTeteProfil({
  utilisateur,
}: {
  utilisateur: { nom: string; prenom: string; email: string; role: string };
}) {
  const initiales = `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase();
  const meta = ROLE_META[utilisateur.role] ?? {
    label: utilisateur.role,
    badge: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    ring: "from-slate-500 to-slate-700",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${meta.ring} text-lg font-semibold text-white shadow-inner ring-4 ring-white`}
      >
        {initiales}
      </div>
      <div className="min-w-0 space-y-1.5">
        <p className="truncate font-semibold text-[#12151F]">
          {utilisateur.prenom} {utilisateur.nom}
        </p>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
        >
          <ShieldCheck className="h-3 w-3" />
          {meta.label}
        </span>
        <p className="flex items-center gap-1 truncate text-xs text-slate-400">
          <Mail className="h-3 w-3" />
          {utilisateur.email}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Composants utilitaires                                            */
/* ---------------------------------------------------------------- */

function FadeIn({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={`transition-all duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
        }`}
    >
      {children}
    </div>
  );
}

function AlerteErreur({ message }: { message: string }) {
  return (
    <FadeIn>
      <p className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {message}
      </p>
    </FadeIn>
  );
}

function AlerteSucces({ message }: { message: string }) {
  return (
    <FadeIn>
      <p className="flex items-start gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        {message}
      </p>
    </FadeIn>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#12151F]">
        {icon}
      </span>
      <div>
        <h2 className="font-semibold leading-none text-[#12151F]">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Informations personnelles                                         */
/* ---------------------------------------------------------------- */

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

  const modifie = nom !== utilisateur.nom || prenom !== utilisateur.prenom;

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
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <SectionHeader
        icon={<User className="h-4 w-4" />}
        title="Informations personnelles"
        description="Votre identité telle qu'elle apparaît dans l'équipe."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            className="focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:border-[#4F46E5]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            required
            className="focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:border-[#4F46E5]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={utilisateur.email}
          disabled
          className="bg-slate-50 text-slate-500"
        />
        <p className="text-xs text-slate-400">L'email ne peut pas être modifié.</p>
      </div>

      {erreur && <AlerteErreur message={erreur} />}
      {succes && <AlerteSucces message="Informations mises à jour avec succès." />}

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button
          type="submit"
          disabled={chargement || !modifie}
          className="gap-2 bg-[#12151F] transition-colors hover:bg-[#12151F]/90 disabled:opacity-40"
        >
          {chargement && <Loader2 className="h-4 w-4 animate-spin" />}
          {chargement ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- */
/* Mot de passe                                                      */
/* ---------------------------------------------------------------- */

function forceMotDePasse(mdp: string) {
  let score = 0;
  if (mdp.length >= 8) score++;
  if (mdp.length >= 12) score++;
  if (/[A-Z]/.test(mdp) && /[a-z]/.test(mdp)) score++;
  if (/[0-9]/.test(mdp) && /[^A-Za-z0-9]/.test(mdp)) score++;
  return score; // 0 - 4
}

const FORCE_LABELS = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"];
const FORCE_COLORS = [
  "bg-slate-200",
  "bg-red-400",
  "bg-amber-400",
  "bg-sky-500",
  "bg-emerald-500",
];

function FormulaireMotDePasse() {
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");
  const [afficherNouveau, setAfficherNouveau] = useState(false);
  const [afficherConfirmation, setAfficherConfirmation] = useState(false);

  const force = forceMotDePasse(nouveauMotDePasse);
  const correspond = confirmation.length > 0 && confirmation === nouveauMotDePasse;

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
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <SectionHeader
        icon={<Lock className="h-4 w-4" />}
        title="Changer le mot de passe"
        description="Utilisez au moins 8 caractères, avec chiffres et majuscules."
      />

      <div className="space-y-2">
        <Label htmlFor="nouveauMotDePasse">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="nouveauMotDePasse"
            type={afficherNouveau ? "text" : "password"}
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            minLength={8}
            className="pr-10 focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:border-[#4F46E5]"
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

        {nouveauMotDePasse.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < force ? FORCE_COLORS[force] : "bg-slate-100"
                    }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400">{FORCE_LABELS[force]}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmation">Confirmer le nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmation"
            type={afficherConfirmation ? "text" : "password"}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className={`pr-10 focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:border-[#4F46E5] ${confirmation.length > 0 && !correspond ? "border-red-300" : ""
              }`}
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
        {confirmation.length > 0 && correspond && (
          <p className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> Les mots de passe correspondent.
          </p>
        )}
      </div>

      {erreur && <AlerteErreur message={erreur} />}
      {succes && <AlerteSucces message="Mot de passe modifié avec succès." />}

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button
          type="submit"
          disabled={chargement}
          className="gap-2 bg-[#12151F] transition-colors hover:bg-[#12151F]/90 disabled:opacity-40"
        >
          {chargement && <Loader2 className="h-4 w-4 animate-spin" />}
          {chargement ? "Modification..." : "Changer le mot de passe"}
        </Button>
      </div>
    </form>
  );
}
