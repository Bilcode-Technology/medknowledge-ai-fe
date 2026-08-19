import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SectionContainer, DEMO_MAILTO } from "@/components/landing/landing-shared"

export function CtaSection() {
  return (
    <section className="border-t border-border py-24 sm:py-32">
      <SectionContainer>
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.02em] text-foreground text-balance sm:text-4xl">
            Ready to bring clinical knowledge governance to your institution?
          </h2>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <Button render={<a href={DEMO_MAILTO} />} size="lg">
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
      </SectionContainer>
    </section>
  )
}
