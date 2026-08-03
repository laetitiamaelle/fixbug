import Link from "next/link";
import { Bug, CheckCircle2, Users, Calendar, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  status: "Actif" | "En pause";
  title: string;
  description: string;
  progress: number;
  bugs: number;
  resolus: number;
  collaborateurs: number;
  date: string;
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="border-slate-100">
      <CardContent>
        <Badge
          className={cn(
            "rounded-full font-medium",
            project.status === "Actif"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {project.status}
        </Badge>

        <h3 className="mt-3 text-lg font-semibold text-slate-900">
          {project.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{project.description}</p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progression</span>
            <span className="font-medium text-slate-900">
              {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} className="mt-1.5 h-1.5" />
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <Bug className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">BUGS</span>
            <span className="font-medium text-slate-900">{project.bugs}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-slate-400">RÉSOLUS</span>
            <span className="font-medium text-slate-900">
              {project.resolus}
            </span>
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {project.collaborateurs}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {project.date}
            </span>
          </div>
          <Link
            href={`/dashboard/projets/${project.id}`}
            className="flex items-center gap-1 font-medium text-slate-900 hover:gap-1.5"
          >
            Détails
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
