import { SectionContainer } from "@/components/landing/landing-shared"

const QUALIFIERS = [
  "Confidence-gated extraction",
  "Layered human review",
  "FHIR R4-native output",
  "Immutable audit trail",
]

export function PositioningStatement() {
  return (
    <section className="border-y border-border py-12 sm:py-16">
      <SectionContainer>
        <p className="max-w-4xl text-xl leading-snug font-medium text-foreground text-balance sm:text-2xl">
          Built for the institutions that govern clinical knowledge &mdash; not for patients
          asking questions.
        </p>
        <p className="mt-6 flex flex-wrap gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
          {QUALIFIERS.map((item, index) => (
            <span key={item} className="flex items-center gap-2.5">
              {item}
              {index < QUALIFIERS.length - 1 && (
                <span className="text-muted-foreground/40" aria-hidden="true">
                  &middot;
                </span>
              )}
            </span>
          ))}
        </p>
      </SectionContainer>
    </section>
  )
}
