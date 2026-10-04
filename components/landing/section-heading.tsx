import { cn } from "@/src/lib/utils";

/**
 * Small uppercase pill badge used as the section label throughout the landing
 * page (OUR MISSION, LEADERSHIP, ADMISSIONS, ...).
 *
 * The spec calls for a light pink/red pill with uppercase red text, which is
 * not one of the Badge component's variants, so this is styled locally.
 */
export function SectionTag({
  children,
  className,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  /** `dark` is for use over the slate footer or dark image fields. */
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        tone === "light"
          ? "bg-[#990000]/10 text-[#990000] dark:bg-[#c1121f]/20 dark:text-[#ff9b9b]"
          : "bg-white/15 text-white/90",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Centred tag + headline block used by most sections. */
export function SectionHeading({
  tag,
  title,
  tone = "light",
  align = "center",
}: {
  tag: string;
  title: React.ReactNode;
  tone?: "light" | "dark";
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <SectionTag tone={tone}>{tag}</SectionTag>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] dark:text-foreground md:text-4xl">
        {title}
      </h2>
    </div>
  );
}