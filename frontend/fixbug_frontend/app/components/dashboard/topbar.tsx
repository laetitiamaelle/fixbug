import { Search, Bell, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopbarProps {
  breadcrumb: string[];
  userName: string;
  userRole: string;
}

export function Topbar({ breadcrumb, userName, userRole }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-4">
      <p className="text-sm text-slate-500">
        {breadcrumb.map((part, i) => (
          <span key={part}>
            {i > 0 && <span className="mx-2 text-slate-300">/</span>}
            <span className={i === breadcrumb.length - 1 ? "font-medium text-slate-900" : ""}>
              {part}
            </span>
          </span>
        ))}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher des bugs, projets..."
            className="w-72 pl-9"
          />
        </div>

        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50">
          <Avatar>
            <AvatarFallback>
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium text-slate-900">
              {userName}
            </span>
            <span className="block text-xs text-slate-400">{userRole}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
