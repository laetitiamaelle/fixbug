import { Bug } from "lucide-react";
import Image from "next/image";
interface LogoProps {
  className?: string;
}


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
