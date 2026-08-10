import { Logo } from "../logo";

import { ArrowLeft,} from "lucide-react";
import Link from "next/link"

interface LeftPanelProps {
  headline: string;
  description: string;
 
}

export function LeftPanel({ headline, description }: LeftPanelProps) {
  return (
    <div className="hidden h-full flex-col justify-between   bg-slate-900 p-10 md:flex md:w-1/2 lg:p-14">
      <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                </div>
      <div className="relative z-10">
        <h2 className="text-3xl font-semibold leading-tight text-white lg:text-4xl mb-10">
          {headline}
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
