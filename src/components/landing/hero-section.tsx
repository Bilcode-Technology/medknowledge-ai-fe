import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SectionContainer, ArtifactCaption, DEMO_MAILTO } from "@/components/landing/landing-shared"

// A record, not a screenshot: the actual field shape an Extraction row
// carries (drug pair, confidence, citation, decision) rendered as typography
// — no browser chrome, no card shadow theatrics.
function ExtractionRecord() {
  return (
    <div className="border-t border-foreground/15 pt-6">
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3.5 text-sm sm:grid-cols-[10rem_1fr]">
        <span className="text-muted-foreground">Source</span>
        <span className="font-mono text-[13px] text-foreground/80">
          J. Clin. Pharmacol., p.12, ¶3
        </span>

        <span className="text-muted-foreground">Interaction</span>
        <span className="text-foreground">Warfarin &times; Amiodarone</span>

        <span className="text-muted-foreground">Confidence</span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-foreground">0.94</span>
          <span className="h-px w-24 bg-border" aria-hidden="true">
            <span className="block h-px w-[94%] bg-primary" />
          </span>
        </span>

        <span className="text-muted-foreground">Severity</span>
        <span className="text-foreground">Major</span>

        <span className="text-muted-foreground">Status</span>
        <span className="flex items-center gap-2 text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
          Awaiting Pharmacist Review
        </span>
      </div>
      <ArtifactCaption>Extraction record &mdash; illustrative, structure matches production output.</ArtifactCaption>
    </div>
  )
}

export function HeroSection() {
  return (
    <section id="beranda" className="py-20 sm:py-28 lg:py-32">
      <SectionContainer>
        <div className="max-w-3xl">
          <p className="text-sm text-muted-foreground">Clinical Knowledge Intelligence Platform</p>

          <h1 className="mt-4 text-[2.5rem] leading-[1.08] font-semibold tracking-[-0.02em] text-foreground text-balance sm:text-5xl lg:text-[3.4rem]">
            Transforming medical literature into trusted, FHIR-native clinical decision knowledge.
          </h1>

          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
            MedKnowledge AI mengekstrak kandidat interaksi obat dari dokumen sumber,
            memverifikasinya berlapis lewat tim farmasi klinis, lalu mempublikasikannya sebagai
            pengetahuan klinis terstruktur. AI mempercepat pembacaan dan pemetaan &mdash;
            keputusan tetap ada di tangan manusia di setiap tahap.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Button render={<a href={DEMO_MAILTO} />} nativeButton={false} size="lg">
              Minta Demo
            </Button>
            <Link
              href="/login"
              className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              Masuk ke Platform &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-16 max-w-2xl sm:mt-20">
          <ExtractionRecord />
        </div>
      </SectionContainer>
    </section>
  )
}
