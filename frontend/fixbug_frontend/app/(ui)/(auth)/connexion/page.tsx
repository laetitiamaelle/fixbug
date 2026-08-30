"use client";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
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
                router.push("/projets");
            } else {
                router.push("/projets");
            }
        } catch (error) {
            console.error("Erreur de connexion :", error);
            setErrorMessage("Impossible de se connecter,.");
            setLoading(false);
        }
    }

    return (
        <main className="flex h-[100dvh] overflow-hidden bg-slate-50">
            <LeftPanel headline="Maîtrisez votre cycle de développement." description="Rejoignez des milliers de chefs de projet et testeurs qui utilisent l'IA pour identifier et résoudre les bugs plus rapidement." />
            <div className="flex w-full min-h-0 flex-1 flex-col overflow-y-auto md:w-[48%] lg:w-[45%]">
                <div className="flex min-h-full w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
                    <div className="w-full max-w-[400px]">
                        <div className="mb-6 flex justify-center md:hidden">
                            <Logo />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                            <div className="hidden justify-center md:flex">
                                <Logo />
                            </div>
                            <div className="mt-4 text-center md:text-left">
                                <h1 className="text-xl font-semibold tracking-tight text-[#0B0E17] sm:text-[22px]">Bon retour parmi nous</h1>
                                <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">Veuillez entrer vos identifiants pour accéder à votre tableau de bord.</p>
                            </div>
                            {errorMessage && (
                                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-relaxed text-red-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Adresse e-mail</Label>
                                    <div className="relative group">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <Input id="email" type="email" required placeholder="vous@exemple.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Mot de passe</Label>
                                        <Link href="/mot-de-passe-oublie" className="text-xs font-medium text-slate-500 hover:text-slate-900 underline-offset-4 hover:underline">Mot de passe oublié ?</Link>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <Input id="password" type={showPassword ? "text" : "password"} required placeholder="••••••••" className="pl-9 pr-9" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} autoComplete="current-password" />
                                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label={showPassword ? "Masquer" : "Afficher"}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full h-9 text-[14px] font-semibold" >
                                    {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /><span>Connexion en cours...</span></>) : ("Se connecter")}
                                </Button>
                                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">

                                </div>
                            </form>
                            <p className="mt-5 text-center text-[13.5px] text-slate-500">Pas encore de compte ? <Link href="/inscription" className="font-semibold text-[#0B0E17] hover:text-emerald-700 underline-offset-4 hover:underline">Inscrivez-vous</Link></p>
                            <p className="mt-2 text-center text-xs text-slate-400">Besoin d'aide ? <Link href="/support" className="font-medium underline hover:text-slate-600">Contacter le support</Link></p>
                        </div>
            
                    </div>
                </div>
            </div>
        </main>
    );
}
