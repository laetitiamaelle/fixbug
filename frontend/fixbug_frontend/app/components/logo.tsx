import { Bug } from "lucide-react";
import Image from "next/image";
interface LogoProps {
  className?: string;
}

/**
 * TODO: remplace le bloc <span> ci-dessous par ton vrai logo, par ex :
 *
 * <Image src="/logo.png" alt="FixBug" width={28} height={28} />
 *
 * (place le fichier image dans /public/logo.png)
 */
export function Logo({ className = "" }: LogoProps) {

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className='flex h-8 w-8 items-center justify-center rounded-lg '>
       <Image src="/logoFixbug.png" alt="FixBug" width={28} height={28} />
      </span>
      <span className="text-lg font-semibold tracking-tight ">
        Fix<span className="text-red-600">Bug</span>
      </span>
    </div>
  );
}
