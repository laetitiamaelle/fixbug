"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft,FolderKanban, Bug, Loader2 ,EyeOff,Eye} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "../../../components/logo";
import { RoleCard } from "../../../components/auth/role-card";
import { SignupAside } from "../../../components/auth/signupRightPanel";
import { LeftPanel } from "../../../components/auth/leftPanel";
import { Stepper } from "../../../components/auth/stepper";

type Role = "chef" | "testeur";

export default function InscriptionPage() {
    const [step, setStep] = useState<1 | 2>(1);
    const [role, setRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        motdepasse: "",
        confirmation: ""
    })
    const router = useRouter()
    // etats pour la gestion du retour API (chargement, erreurs, succès)
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    // etats pour afficher/masquer les mots de passe
    const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
    const [afficherConfirmation, setAfficherConfirmation] = useState(false);

    // variable de pour l'api
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    // fonction pour modifier la valeur des input du formulaire lorsqu'ils change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.id]: e.target.value,
        }));
    };

    const roleUser = role === "chef" ? "CHEF_PROJET" : "TESTEUR"
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
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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
            } catch (parseError) {
                console.error("Erreur de parsing JSON/Texte :", parseError, "Données reçues :", textData);
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

            // Message générique à l'écran pour l'utilisateur
            setErrorMessage("Un problème est survenu.");
            setLoading(false)
        }
    };
    if (step === 2) {
        return (
            <main className="flex w-full overflow-hidden ">
                <LeftPanel
                    headline="Rejoignez votre équipe sur FixBug."
                    description="Créez votre compte pour commencer à déclarer, suivre et corriger les anomalies avec l'aide de l'IA."
                />

                <div className="flex w-full items-center justify-center bg-slate-50 px-6 py-16 md:w-1/2">
                    <div className="w-full max-w-sm">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </button>

                        <Stepper current={2} />

                        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                            Vos informations
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Inscription en tant que{" "}
                            <span className="font-medium text-slate-700">
                                {role === "chef" ? "Chef de projet" : "Testeur "}
                            </span>
                            .
                        </p>

                        {errorMessage && (
                            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                                {errorMessage}
                            </div>
                        )}


                        {successMessage && (
                            <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
                                {successMessage}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="prenom">Prénom</Label>
                                    <Input id="prenom" onChange={handleChange} value={formData.prenom} required placeholder="laetitia" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nom">Nom</Label>
                                    <Input id="nom" required placeholder="maelle" onChange={handleChange} value={formData.nom} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Adresse e-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="example@gmail.com"
                                    onChange={handleChange} value={formData.email}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="motdepasse">Mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="motdepasse"
                                            type={afficherMotDePasse ? "text" : "password"}
                                            required
                                            minLength={8}
                                            placeholder="••••••••"
                                            onChange={handleChange}
                                            value={formData.motdepasse}
                                            className="pr-9"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAfficherMotDePasse((v) => !v)}
                                            className="absolute right-0 top-0 flex h-full w-9 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                                            tabIndex={-1}
                                            aria-label={afficherMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                        >
                                            {afficherMotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmation">Confirmation</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmation"
                                            type={afficherConfirmation ? "text" : "password"}
                                            required
                                            placeholder="••••••••"
                                            onChange={handleChange}
                                            value={formData.confirmation}
                                            className="pr-9"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAfficherConfirmation((v) => !v)}
                                            className="absolute right-0 top-0 flex h-full w-9 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                                            tabIndex={-1}
                                            aria-label={afficherConfirmation ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                        >
                                            {afficherConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Création en cours...</span>
                                    </>
                                ) : (
                                    "Créer mon compte"
                                )}
                            </Button>
                        </form>


                        <p className="mt-6 text-center text-sm text-slate-500">
                            Déjà un compte ?{" "}
                            <Link href="/connexion" className="font-semibold text-slate-900">
                                Connectez-vous
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex h-full w-full bg-slate-50">
            <div className="flex h-full w-full flex-col p-6 md:w-1/2 lg:p-10">
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                </div>

                <div className="flex flex-1 flex-col justify-center py-10">
                    <div className="mx-auto w-full max-w-sm">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Créer votre compte
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Rejoignez la plateforme de gestion de bugs assistée par IA
                            préférée des équipes techniques.
                        </p>

                        <div className="mt-8">
                            <Stepper current={1} />
                        </div>

                        <p className="mt-6 text-sm font-medium text-slate-900">
                            Quel est votre profil ?
                        </p>
                        <p className="text-sm text-slate-500">
                            Choisissez votre rôle pour que nous puissions adapter votre dashboard.
                        </p>

                        <div className="mt-4 space-y-3">
                            <RoleCard
                                icon={FolderKanban}
                                title="Chef de projet"
                                description="Gérez les cycles de développement, assignez les tâches et supervisez la résolution globale."
                                selected={role === "chef"}
                                onSelect={() => setRole("chef")}
                            />
                            <RoleCard
                                icon={Bug}
                                title="Testeur "
                                description="Déclarez des anomalies, validez les corrections et assurez la qualité logicielle."
                                selected={role === "testeur"}
                                onSelect={() => setRole("testeur")}
                            />
                        </div>

                        <Button
                            className="mt-6 w-full bg-slate-900 hover:bg-slate-800"
                            disabled={!role}
                            onClick={() => setStep(2)}
                        >
                            Continuer
                        </Button>

                        <p className="mt-8 text-center text-sm text-slate-500">
                            Vous avez déjà un compte ?
                            <Link href="/connexion" className="font-semibold text-slate-900">
                                Connectez-vous
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <SignupAside />
        </main>
    );
}