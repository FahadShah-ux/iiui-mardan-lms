
import { GraduationCap } from "lucide-react";

export function BrandBanner() {
  return (
    <div className="flex h-14 items-center border-b bg-gradient-to-r from-[#990000] to-[#c1121f] px-4 text-white md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight sm:text-[15px]">
            Islamic International University Islamabad - Mardan Campus
          </p>
          <p className="hidden text-[11px] text-white/80 sm:block">Learning Management System</p>
        </div>
      </div>
    </div>
  );
}

