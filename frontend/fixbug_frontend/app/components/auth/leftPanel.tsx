import { Logo } from "../logo";



interface LeftPanelProps {
  headline: string;
  description: string;
 
}

export function LeftPanel({ headline, description }: LeftPanelProps) {
  return (
    <div className="hidden h-screen flex-col justify-between   bg-slate-900 p-10 md:flex md:w-1/2 lg:p-14">
      
      <div className="absolute inset-0 opacity-[0.07] " />

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
