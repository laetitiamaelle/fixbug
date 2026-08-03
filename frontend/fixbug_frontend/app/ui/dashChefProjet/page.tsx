import { Filter, Plus, FolderKanban, Bug, TrendingUp, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "../../components/dashboard/topbar";
import { StatCard } from "../../components/dashboard/stat-card";
import { WeeklyActivityChart } from "../../components/dashboard/weekly-activity-chart";
import { AiAssistantCard } from "../../components/dashboard/ai-assistant-card";
import { ProjectCard, type Project } from "../../components/dashboard/project-card";
import { RecentActivity, type ActivityItem } from "../../components/dashboard/recent-activity";
import { HelpCard } from "../../components/dashboard/help-card";

const projects: Project[] = [
  {
    id: "ecommerce-redesign",
    status: "Actif",
    title: "E-Commerce Redesign",
    description: "Refonte complète de l'expérience utilisateur et migration vers Next.js 14.",
    progress: 65,
    bugs: 24,
    resolus: 15,
    collaborateurs: 8,
    date: "12 Oct",
  },
  {
    id: "mobile-app-api",
    status: "Actif",
    title: "Mobile App API",
    description: "Développement des endpoints pour l'application mobile de fidélité.",
    progress: 32,
    bugs: 12,
    resolus: 4,
    collaborateurs: 4,
    date: "28 Nov",
  },
  {
    id: "plateforme-logistique",
    status: "En pause",
    title: "Plateforme Logistique",
    description: "Outil interne de gestion des stocks et de suivi des expéditions en temps réel.",
    progress: 88,
    bugs: 5,
    resolus: 5,
    collaborateurs: 3,
    date: "05 Sep",
  },
  {
    id: "crm-integration",
    status: "Actif",
    title: "CRM Intégration",
    description: "Synchronisation des données clients entre Salesforce et notre backend.",
    progress: 15,
    bugs: 42,
    resolus: 10,
    collaborateurs: 6,
    date: "15 Jan",
  },
];

const activities: ActivityItem[] = [
  {
    id: "1",
    name: "Alice Martin",
    action: "a résolu le bug #FB-1024",
    time: "Il y a 12 min",
  },
  {
    id: "2",
    name: "Marc Durand",
    action: "a ouvert un bug critique #FB-1028",
    time: "Il y a 45 min",
    urgent: true,
  },
  {
    id: "3",
    name: "Sophie Lefebvre",
    action: "a rejoint le projet E-Commerce",
    time: "Il y a 2h",
  },
  {
    id: "4",
    name: "Jean Dupont",
    action: "a mis à jour la deadline de CRM Sync",
    time: "Il y a 4h",
  },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar
        breadcrumb={["Dashboard", "Suivi des bugs"]}
        userName="Jean Dupont"
        userRole="Chef de projet"
      />

      <main className="flex-1 space-y-6 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Tableau de bord
            </h1>
            <p className="mt-1 text-slate-500">
              Bienvenue, Jean. Voici un aperçu de l&apos;état de santé de vos
              projets et du flux de bugs.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              Filtrer
            </Button>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              Nouveau Projet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FolderKanban}
            label="Projets Actifs"
            value="12"
            change="+24%"
            changeTone="positive"
          />
          <StatCard
            icon={Bug}
            label="Bugs Ouverts"
            value="156"
            change="-12%"
            changeTone="positive"
          />
          <StatCard
            icon={TrendingUp}
            label="Taux de Résolution"
            value="84%"
            change="+5.2%"
            changeTone="positive"
          />
          <StatCard
            icon={Clock3}
            label="Temps Moyen Fix"
            value="4.2h"
            change="+0.4h"
            changeTone="neutral"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <WeeklyActivityChart />

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Projets Récents
                  </h2>
                  <Badge className="rounded-full bg-slate-100 text-slate-600">
                    {projects.length}
                  </Badge>
                </div>
                <a
                  href="/dashboard/projets"
                  className="text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  Voir tout →
                </a>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <AiAssistantCard />
            <RecentActivity items={activities} />
            <HelpCard />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
          <span>© 2026 FixBug - Plateforme de gestion intelligente des bugs.</span>
          <div className="flex gap-4">
            <a href="/confidentialite" className="hover:text-slate-600">
              Politique de confidentialité
            </a>
            <a href="/support" className="hover:text-slate-600">
              Support technique
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
