import Link from "next/link";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface ActivityItem {
  id: string;
  name: string;
  action: string;
  time: string;
  urgent?: boolean;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="border-slate-100">
      <CardContent>
        <h3 className="text-base font-semibold text-slate-900">
          Activités Récentes
        </h3>
        <p className="text-sm text-slate-500">
          Mises à jour en temps réel de votre équipe
        </p>

        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <Avatar>
                <AvatarFallback>
                  {item.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {item.name}
                  </span>{" "}
                  {item.action}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </span>
                  {item.urgent && (
                    <Badge className="rounded-full bg-red-50 text-red-600">
                      Urgent
                    </Badge>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard/activites"
          className="mt-4 block text-center text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Voir tout l&apos;historique
        </Link>
      </CardContent>
    </Card>
  );
}
