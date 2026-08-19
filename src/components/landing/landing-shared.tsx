import { cn } from "@/lib/utils"

export function SectionContainer({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  )
}

// Figure-style caption for a product artifact (e.g. "Extraction record — illustrative").
// Deliberately plain text, not a colored pill — the artifact itself carries the
// visual weight, the caption just names what it is.
export function ArtifactCaption({ children }: { children: React.ReactNode }) {
  return <p className="mt-2.5 text-xs text-muted-foreground">{children}</p>
}

export const DEMO_MAILTO =
  "mailto:hello@medknowledge.ai?subject=Permintaan%20Demo%20MedKnowledge%20AI&body=Halo%20Tim%20MedKnowledge%20AI%2C%0A%0AKami%20tertarik%20untuk%20menjadwalkan%20demo%20platform.%0A%0ANama%20Institusi%3A%0AKebutuhan%3A%0A"
