"use client";
import { buttonVariants, Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconeGithub } from "../../../../components/icone-github";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

// Liste prédéfinie, façon "langage" GitHub
const TECHNOLOGIES_DISPONIBLES = [
    "JavaScript", "TypeScript", "Python", "Java", "C#", "PHP", "Ruby", "Go", "Rust",
    "React", "Next.js", "Angular", "Vue.js", "NestJS", "Django", "Laravel", "Spring Boot",
    "PostgreSQL", "MySQL", "MongoDB", "Docker", "Redis",
];

export default function NouveauProjetPage() {
    const router = useRouter();
    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");
    const [lienGithub, setLienGithub] = useState("");
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [technoSelectionnee, setTechnoSelectionnee] = useState("");
    const [chargement, setChargement] = useState(false);

    function ajouterTechnologie() {
        if (technoSelectionnee && !technologies.includes(technoSelectionnee)) {
            setTechnologies([...technologies, technoSelectionnee]);
        }
        setTechnoSelectionnee("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setChargement(true);
        try {
            const projet = await apiFetch("/projets", {
                method: "POST",
                body: JSON.stringify({ nom, description, lienGithub, technologies }),
            });
            // NOUVEAU : message de succès avant la redirection
            toast.success("Projet créé avec succès");
            router.push(`/projets/${projet.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
        } finally {
            setChargement(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Link href="/projets" className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-[#12151F]">
                <ArrowLeft className="h-4 w-4" /> Retour aux projets
            </Link>

            <h1 className="text-2xl font-bold text-[#12151F]">Créer un nouveau projet</h1>
            <p className="mb-6 text-sm text-slate-500">Configurez les informations de base de votre nouveau projet.</p>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
                <div className="space-y-2">
                    <Label htmlFor="nom">Nom du projet</Label>
                    <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lienGithub">Dépôt GitHub</Label>
                    <div className="relative">
                        <IconeGithub className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="lienGithub" className="pl-9" value={lienGithub} onChange={(e) => setLienGithub(e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Technologies</Label>
                    {technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 rounded-md border border-slate-200 bg-slate-50 p-2">
                            {technologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="gap-1 font-normal">
                                    {tech}
                                    <button type="button" onClick={() => setTechnologies(technologies.filter((t) => t !== tech))}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* NOUVEAU : liste déroulante façon GitHub, plus de champ texte libre */}
                    <div className="flex gap-2">
                        <Select
                            value={technoSelectionnee}
                            onValueChange={(val) => setTechnoSelectionnee(val ?? "")}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Choisir une technologie..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TECHNOLOGIES_DISPONIBLES.filter((t) => !technologies.includes(t)).map((tech) => (
                                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={ajouterTechnologie} disabled={!technoSelectionnee}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <Link href="/projets" className={buttonVariants({ variant: "outline" })}>Annuler</Link>
                    <Button type="submit" disabled={chargement} className="bg-[#12151F] hover:bg-[#12151F]/90">
                        {chargement ? "Création..." : "Créer le projet"}
                    </Button>
                </div>
            </form>
        </div>
    );
}