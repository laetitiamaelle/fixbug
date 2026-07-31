import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, LucideIcon } from "lucide-react";

interface FeatureItem {
    label: string;
}

interface FeatureSectionProps {
    imageUrl: string;
    imageAlt?: string;
    title: string;
    description: string;
    items: FeatureItem[];
    reverse?: boolean;
    panelClassName?: string;
}

export function FeatureSection({
    imageUrl,
    imageAlt = "Illustration de la fonctionnalité",
    title,
    description,
    items,
    reverse = false,
    panelClassName = "bg-slate-50",
}: FeatureSectionProps) {
    return (
        <section
            id="fonctionnalites"
            className="mx-auto max-w-6xl px-6 py-16 md:py-20"
        >
            <div
                className={`grid items-center gap-12 md:grid-cols-2 ${reverse ? "md:[&>*:first-child]:order-2" : ""
                    }`}      
            >
                <div
          className={`relative aspect-video overflow-hidden rounded-2xl border border-slate-100 ${panelClassName}`}
        >
          <img src={imageUrl} alt={imageAlt}
            className="object-cover" 
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                        {title}
                    </h2>
                    <p className="mt-3 max-w-md text-slate-500">{description}</p>

                    <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {items.map((item) => (
                            <li
                                key={item.label}
                                className="flex items-center gap-2 text-sm text-slate-600"
                            >
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                {item.label}
                            </li>
                        ))}
                    </ul>

                    <Link
                        href="#"
                        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:gap-2 transition-all"
                    >
                        En savoir plus
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                
            </div>
        </section>
    );
}
