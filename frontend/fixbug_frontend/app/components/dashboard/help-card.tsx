import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HelpCard() {
  return (
    <Card className="border-slate-100">
      <CardContent className="flex flex-col items-center text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900">
          <HelpCircle className="h-5 w-5 text-white" />
        </span>
        <h3 className="mt-3 text-sm font-semibold text-slate-900">
          Besoin d&apos;aide ?
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Consultez notre documentation sur la gestion intelligente des bugs
          avec l&apos;IA.
        </p>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link href="/documentation">Documentation</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
