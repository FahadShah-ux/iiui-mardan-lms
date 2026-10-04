import { cn } from "@/src/lib/utils";

/**
 * Geometric stand-in for photography.
 *
 * The landing page spec calls for roughly fourteen photographic slots. No
 * photographs exist in this repo and inventing faces for the named staff in
 * the spec would be misleading, so every image slot renders one of these
 * panels instead. They are built from the brand tokens, read as deliberate
 * design rather than as a missing asset, and work in both colour themes.
 *
 * To use real photography later: drop files into `public/images/`, then replace
 * the panel with a next/image element. Nothing else has to change.
 */

type Tone = "crimson" | "slate" | "gradient" | "tint";

const TONES: Record<Tone, string> = {
  // Deep crimson field.
  crimson: "bg-[#7a0000]",
  // Dark slate, used for the footer and campus divider.
  slate: "bg-[#1E293B]",
  // Vertical crimson-to-charcoal ramp for the hero.
  gradient: "bg-gradient-to-br from-[#8B0000] via-[#990000] to-[#0F172A]",
  // Very light crimson wash for programme cards.
  tint: "bg-gradient-to-br from-[#990000]/8 to-[#990000]/3",
};

export function MediaPlaceholder({
  tone = "crimson",
  label,
  ratio = "aspect-[4/3]",
  className,
  children,
}: {
  tone?: Tone;
  /** Optional caption. Rendered small and low-contrast on purpose. */
  label?: string;
  ratio?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={label ? undefined : true}
      className={cn("relative w-full overflow-hidden", TONES[tone], ratio, className)}
    >
      {/* Diagonal band */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0 2px, transparent 2px 26px)",
        }}
      />
      {/* Corner glow, keeps large fields from looking flat */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#c1121f]/20 blur-2xl" />

      {children}

      {label ? (
        <span className="absolute bottom-3 left-4 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
          {label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Portrait variant for leadership cards: a monogram instead of a face.
 */
export function PortraitPlaceholder({
  name,
  tone = "crimson",
  className,
}: {
  name: string;
  tone?: Tone;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <MediaPlaceholder tone={tone} ratio="aspect-[4/5]" className={className}>
      <div className="flex h-full items-center justify-center">
        <span className="text-5xl font-bold tracking-tight text-white/85">{initials}</span>
      </div>
    </MediaPlaceholder>
  );
}