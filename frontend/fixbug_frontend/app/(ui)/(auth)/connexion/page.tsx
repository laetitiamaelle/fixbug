"use client";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeftPanel } from "../../../components/auth/leftPanel";
import { Logo } from "@/app/components/logo";

export default function ConnexionPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [motdepasse, setMotdepasse] = useState("");
    const [loading, setLoading] = useState(false);
    const { rafraichir } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    motdepasse: motdepasse.trim(),
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
                setErrorMessage(
                    typeof data === "object" && data.message
                        ? Array.isArray(data.message)
                            ? data.message.join(", ")
                            : data.message
                        : "Identifiants incorrects."
                );
                setLoading(false);
                return;
            }


            if (data.access_token || data.token) {
                localStorage.setItem("token", data.access_token || data.token);
                await rafraichir()
            }

            console.log("=== REPONSE DE L'API LOGIN ===", data);
            const userRole = data.utilisateur?.role || data.user?.role || data.role;
            if (userRole === "CHEF_PROJET") {
                router.push("/chef_projet");
            } else if (userRole === "ADMINISTRATEUR") {
                router.push("/admin");
            } else if (userRole === "DEVELOPPEUR") {
                router.push("/projets"); // ou /bugs, selon ce que tu préfères comme accueil développeur
            } else {
                router.push("/projets"); // Testeur
            }
        } catch (error) {
            console.error("Erreur de connexion :", error);
            setErrorMessage("Impossible de se connecter,.");
            setLoading(false);
        }
    }
    return (
        <main className="flex h-full">
            <LeftPanel
                headline="Maîtrisez votre cycle de développement."
                description="Rejoignez des milliers de chefs de projet et testeurs qui utilisent l'IA pour identifier et résoudre les bugs plus rapidement ."
            />

            <div className="flex w-full items-center justify-center bg-slate-50 px-6  md:w-1/2">

                <div className="w-full max-w-sm">
                    <div className="mb-8 flex justify-center">
                        <Logo className="scale-125" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Bon retour parmi nous
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Veuillez entrer vos identifiants pour accéder à votre tableau de
                        bord.
                    </p>
                    {errorMessage && (
                        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                            {errorMessage}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Adresse e-mail</Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="example@gmail.com"
                                    className="pl-9 hover:border-[#00D08C]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Link
                                    href="/mot-de-passe-oublie"
                                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="pl-9 pr-9 hover:border-[#00D08C]"
                                    value={motdepasse}
                                    onChange={(e) => setMotdepasse(e.target.value)}

                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    aria-label={
                                        showPassword
                                            ? "Masquer le mot de passe"
                                            : "Afficher le mot de passe"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
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
                                    <span>Connexion en cours...</span>
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Pas encore de compte ?{" "}
                        <Link href="/inscription" className="font-semibold text-slate-900">
                            Inscrivez vous
                        </Link>
                    </p>

                    <p className="mt-3 text-center text-xs text-slate-400">
                        Besoin d'aide ?{" "}
                        <Link href="/support" className="underline hover:text-slate-600">
                            Contacter le support: 681282580
                        </Link>
                    </p>
                    <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm">
                        <p>&copy; 2026- @laetitia maelle</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
