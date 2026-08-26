"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderKanban, Bug, Code2, Loader2, EyeOff, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "../../../components/logo";
import { RoleCard } from "../../../components/auth/role-card";
import { SignupAside } from "../../../components/auth/signupRightPanel";
import { LeftPanel } from "../../../components/auth/leftPanel";
import { Stepper } from "../../../components/auth/stepper";
import { ScrollArea } from "@/components/ui/scroll-area";

type Role = "chef" | "testeur" | "developpeur";

export default function InscriptionPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", motdepasse: "", confirmation: "",
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [afficherConfirmation, setAfficherConfirmation] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const roleUser =
    role === "chef" ? "CHEF_PROJET" : role === "developpeur" ? "DEVELOPPEUR" : "TESTEUR";

  const labelRole =
    role === "chef" ? "Chef de projet" : role === "developpeur" ? "Développeur" : "Testeur";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (formData.motdepasse.trim() !== formData.confirmation.trim()) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    if (formData.motdepasse.trim().length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim(),
          motdepasse: formData.motdepasse.trim(),
          role: roleUser,
        }),
      });

      const textData = await response.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch {
        data = textData;
      }

      if (!response.ok) {
        console.error("Erreur HTTP Backend :", response.status, textData);
        setErrorMessage("Un problème est survenu lors de l'inscription.");
        return;
      }

      setTimeout(() => {
        setSuccessMessage("Compte créé avec succès ! Redirection en cours...");
        setLoading(false);
      }, 2000);
      setTimeout(() => {
        router.push("/connexion");
      }, 3000);
    } catch (error) {
      console.error("Erreur réseau ou serveur inaccessible :", error);
      setErrorMessage("Un problème est survenu.");
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <main className="flex h-screen max-h-screen overflow-hidden bg-slate-50">
        <LeftPanel
          headline="Rejoignez votre équipe sur FixBug."
          description="Créez votre compte pour commencer à déclarer, suivre et corriger les anomalies avec l'aide de l'IA."
        />
        <div className="flex w-full min-h-0 flex-col overflow-hidden md:w-[48%] lg:w-[45%]">
          <div className="flex h-full w-full flex-col overflow-hidden px-4 py-3 sm:px-6 lg:px-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors group shrink-0"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Retour
            </button>

            <div className="flex flex-1 min-h-0 items-center justify-center overflow-hidden">
              <div className="w-full max-w-[420px] max-h-full overflow-hidden flex flex-col">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden flex flex-col">
                  <Stepper current={2} />

                  <h1 className="mt-3 text-[18px] font-semibold tracking-tight text-[#0B0E17]">Vos informations</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Inscription en tant que <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{labelRole}</span>
                  </p>

                  {errorMessage && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{errorMessage}</span>
                    </div>
                  )}
                  {successMessage && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{successMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-4 space-y-3 overflow-hidden">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="prenom" className="text-xs">Prénom</Label>
                        <Input id="prenom" onChange={handleChange} value={formData.prenom} required placeholder="laetitia" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="nom" className="text-xs">Nom</Label>
                        <Input id="nom" required placeholder="maelle" onChange={handleChange} value={formData.nom} className="h-8 text-sm" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs">Adresse e-mail</Label>
                      <Input id="email" type="email" required placeholder="example@gmail.com" onChange={handleChange} value={formData.email} className="h-8 text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="motdepasse" className="text-xs">Mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="motdepasse"
                            type={afficherMotDePasse ? "text" : "password"}
                            required minLength={8} placeholder="••••••••"
                            onChange={handleChange} value={formData.motdepasse} className="pr-8 h-8 text-sm"
                          />
                          <button type="button" onClick={() => setAfficherMotDePasse((v) => !v)}
                            className="absolute right-0 top-0 flex h-full w-8 items-center justify-center text-slate-400 hover:text-slate-600" tabIndex={-1}>
                            {afficherMotDePasse ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="confirmation" className="text-xs">Confirmation</Label>
                        <div className="relative">
                          <Input
                            id="confirmation"
                            type={afficherConfirmation ? "text" : "password"}
                            required placeholder="••••••••"
                            onChange={handleChange} value={formData.confirmation} className="pr-8 h-8 text-sm"
                          />
                          <button type="button" onClick={() => setAfficherConfirmation((v) => !v)}
                            className="absolute right-0 top-0 flex h-full w-8 items-center justify-center text-slate-400 hover:text-slate-600" tabIndex={-1}>
                            {afficherConfirmation ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 h-8 text-sm mt-1">
                      {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /><span>Création en cours...</span></>) : ("Créer mon compte")}
                    </Button>
                  </form>

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Déjà un compte ? <Link href="/connexion" className="font-semibold text-slate-900">Connectez-vous</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen max-h-screen overflow-hidden bg-slate-50">
      <div className="flex w-full min-h-0 flex-col overflow-hidden md:w-[52%] lg:w-[55%]">
        <div className="flex h-full w-full flex-col overflow-hidden px-4 py-3 sm:px-6 lg:px-6">
          <div className="flex items-center justify-between shrink-0">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors group">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Retour à l'accueil
            </Link>
            <span className="hidden sm:inline-flex text-xs text-slate-400">Étape 1 sur 2</span>
          </div>

          <div className="flex flex-1 min-h-0 items-center justify-center overflow-hidden py-2">
            <div className="w-full max-w-[420px] max-h-full overflow-hidden flex flex-col">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden flex flex-col">
                <div className="shrink-0">
                  <Logo />
                  <h1 className="mt-3 text-[20px] font-semibold tracking-tight text-[#0B0E17]">Créer votre compte</h1>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Rejoignez la plateforme de gestion de bugs assistée par IA.
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-2">
                    <Stepper current={1} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#0B0E17]">Quel est votre profil ?</p>
                  <p className="text-xs leading-relaxed text-slate-500">Choisissez votre rôle pour adapter votre dashboard.</p>
                </div>

                <ScrollArea className="mt-3 h-[210px] -mr-2 pr-2">
                  <div className="space-y-2 pr-1">
                    <RoleCard
                      icon={FolderKanban}
                      title="Chef de projet"
                      description="Gérez les cycles de développement et la livraison."
                      selected={role === "chef"}
                      onSelect={() => setRole("chef")}
                    />
                    <RoleCard
                      icon={Bug}
                      title="Testeur"
                      description="Déclarez des anomalies et assurez la qualité."
                      selected={role === "testeur"}
                      onSelect={() => setRole("testeur")}
                    />
                    <RoleCard
                      icon={Code2}
                      title="Développeur"
                      description="Corrigez le code avec l'aide de l'IA et proposez sur GitHub."
                      selected={role === "developpeur"}
                      onSelect={() => setRole("developpeur")}
                    />
                  </div>
                </ScrollArea>

                <div className="shrink-0 mt-3">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 h-8 text-sm" disabled={!role} onClick={() => setStep(2)}>
                    Continuer
                  </Button>

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Vous avez déjà un compte ?{" "}
                    <Link href="/connexion" className="font-semibold text-slate-900">Connectez-vous</Link>
                  </p>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400 shrink-0">En continuant, vous acceptez nos conditions d’utilisation.</p>
            </div>
          </div>
        </div>
      </div>

      <SignupAside />
    </main>
  );
}
