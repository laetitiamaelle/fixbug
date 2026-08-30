"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderGit2 ,FolderOpenDot, X, Search, Folder} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { IconeGithub } from "../../../components/icone-github";
import { toast } from "sonner";

type Projet = { id: number; nom: string };

const TECHNOLOGIES_DISPONIBLES = [
    "JavaScript", "TypeScript", "Python", "Java", "C#", "PHP", "Ruby", "Go", "Rust",
    "React", "Next.js", "Angular", "Vue.js", "NestJS", "Django", "Laravel", "Spring Boot",
];

export default function ProjetsPage() {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [projets, setProjets] = useState<Projet[] | null>(null);
  const [recherche, setRecherche] = useState("");
  const estChefProjet = utilisateur?.role === "CHEF_PROJET";

  // modal state
  const [open, setOpen] = useState(false);
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

  async function handleCreate(e: React.FormEvent) {
      e.preventDefault();
      setChargement(true);
      try {
          const projet = await apiFetch("/projets", {
              method: "POST",
              body: JSON.stringify({ nom, description, lienGithub, technologies }),
          });
          toast.success("Projet créé avec succès");
          setOpen(false);
          // reset
          setNom(""); setDescription(""); setLienGithub(""); setTechnologies([]);
          // refresh list or navigate
          setProjets((prev) => prev ? [...prev, projet] : [projet]);
          router.push(`/projets/${projet.id}`);
      } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
      } finally {
          setChargement(false);
      }
  }

  useEffect(() => { apiFetch("/projets").then(setProjets).catch(() => setProjets([])); }, []);

  const projetsFiltres = projets?.filter(p => p.nom.toLowerCase().includes(recherche.toLowerCase())) ?? null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#12151F] flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12151F] text-white"><Folder className="h-4 w-4" /></span>
              Projets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {estChefProjet ? "Gérez vos projets et suivez leur activité." : "Projets auxquels vous collaborez."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {projets && projets.length > 0 && (
              <span className="hidden sm:inline-flex text-xs text-slate-500 mr-1">{projetsFiltres?.length} / {projets.length}</span>
            )}
            {estChefProjet && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger className={buttonVariants({ className: "bg-[#12151F] hover:bg-[#12151F]/90" })}>
                  <Plus className="mr-2 h-4 w-4" /> Nouveau projet
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau projet</DialogTitle>
                    <DialogDescription>Configurez les informations de base de votre nouveau projet.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 mt-2">
                      <div className="space-y-2">
                          <Label htmlFor="nom">Nom du projet</Label>
                          <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Mon projet" />
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description du projet..." />
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="lienGithub">Dépôt GitHub</Label>
                          <div className="relative">
                              <IconeGithub className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input id="lienGithub" className="pl-9" value={lienGithub} onChange={(e) => setLienGithub(e.target.value)} placeholder="https://github.com/user/repo" />
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

                      <div className="flex justify-end gap-3 pt-2">
                          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                          <Button type="submit" disabled={chargement} className="bg-[#12151F] hover:bg-[#12151F]/90">
                              {chargement ? "Création..." : "Créer le projet"}
                          </Button>
                      </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        {projets && projets.length > 0 && (
          <div className="relative max-w-sm mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un projet..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-9 h-8 bg-white"
            />
          </div>
        )}
      </div>

      {projets === null ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : projets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><FolderGit2 size={20} className="text-slate-400" /></div>
          <p className="text-sm text-slate-500">
            {estChefProjet ? "Créez votre premier projet pour commencer." : "Vous serez notifié(e) dès qu'un chef de projet vous invitera."}
          </p>
          {estChefProjet && (
            <Button onClick={() => setOpen(true)} className="mt-2 bg-[#12151F] hover:bg-[#12151F]/90"><Plus className="mr-2 h-4 w-4"/> Créer un projet</Button>
          )}
        </div>
      ) : projetsFiltres && projetsFiltres.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><Search size={20} className="text-slate-400" /></div>
          <p className="text-sm font-medium text-slate-900">Aucun projet trouvé</p>
          <p className="text-sm text-slate-500">Aucun projet ne correspond à "{recherche}".</p>
          <Button variant="outline" size="sm" onClick={() => setRecherche("")} className="mt-1">Effacer la recherche</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(projetsFiltres ?? []).map((projet) => (
            <Link
              key={projet.id}
              href={`/projets/${projet.id}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors">
                <FolderOpenDot
                  className="h-8 w-8 text-[#353b4e]"
                  strokeWidth={1.2}
                />
              </div>
              <span className="line-clamp-2 text-sm font-medium text-[#12151F]">{projet.nom}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
