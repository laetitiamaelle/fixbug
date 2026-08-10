import Link from "next/link";
import { Plus, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaGithub } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Données factices en attendant la connexion à l'API
const projetsFictifs = [
  {
    id: 1,
    nom: "Fixbug",
    description: "Plateforme de gestion de bugs assistée par IA.",
    lienGithub: "https://github.com/laetitia/fixbug",
    technologies: ["Next.js", "NestJS", "PostgreSQL"],
    nombreBugs: 4,
    nombreCollaborateurs: 3,
  },
  {
    id: 2,
    nom: "Votify",
    description: "Plateforme de vote électronique.",
    lienGithub: "https://github.com/laetitia/votify",
    technologies: ["Angular", "Django"],
    nombreBugs: 1,
    nombreCollaborateurs: 2,
  },
];

export default function ProjetsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Projets</h1>
          <p className="text-sm text-brand-slate">Gérez vos projets et suivez leur activité.</p>
        </div>
        <Button  className="bg-brand-ink hover:bg-brand-ink/90">
          <Link href="/ui/projet/nouveau">
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projetsFictifs.map((projet) => (
          <CarteProjet key={projet.id} projet={projet} />
        ))}
      </div>
    </div>
  );
}

function CarteProjet({ projet }: { projet: (typeof projetsFictifs)[number] }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <Link href={`/projets/${projet.id}`} className="font-semibold text-brand-ink hover:underline">
          {projet.nom}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded p-1 text-brand-slate hover:bg-slate-100">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem >
              <Link href={`/projets/${projet.id}/modifier`}>
                <Pencil className="mr-2 h-4 w-4" /> Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-brand-slate">{projet.description}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {projet.technologies.map((tech) => (
          <Badge key={tech} variant="secondary" className="font-normal">
            {tech}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3 text-xs text-brand-slate">
        <a
          href={projet.lienGithub}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-brand-ink"
        >
         <FaGithub className="h-4 w-4" />Dépôt
        </a>
        <div className="flex items-center gap-3">
          <span>{projet.nombreBugs} bug(s)</span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {projet.nombreCollaborateurs}
          </span>
        </div>
      </div>
    </div>
  );
}