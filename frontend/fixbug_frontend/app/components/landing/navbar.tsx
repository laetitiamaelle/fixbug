import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "../logo";

const links = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Solutions", href: "#solutions" },
 
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b shadow-2xl  bg-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        <nav className="hidden items-center gap-4 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-600 transition-colors hover:text-slate-900">
             <span className="hover:w-full w-20 hover:bg-slate-400 rounded-2xl">{link.label}</span> 
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
           <Button  size="sm" className="border border-slate-900 text-slate-900 bg-transparent hover:bg-slate-900 hover:text-white transition-colors duration-200">
            <Link href="/ui/auth/connexion">sign up</Link>
          </Button>
          <Button  size="sm" className="hover:border-slate-900 border bg-slate-800">
            <Link href="/ui/auth/inscription">sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
