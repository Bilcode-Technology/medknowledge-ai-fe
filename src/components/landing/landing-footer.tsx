import Link from "next/link"
import { Cpu } from "lucide-react"
import { SectionContainer } from "@/components/landing/landing-shared"

const FOOTER_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Teknologi", href: "#teknologi" },
  { label: "FAQ", href: "#faq" },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <SectionContainer>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="#beranda" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Cpu className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-foreground">MedKnowledge AI</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Platform tata kelola pengetahuan klinis untuk institusi kesehatan — dari ekstraksi
              AI hingga publikasi FHIR yang terverifikasi manusia.
            </p>
          </div>

          <nav className="flex gap-6" aria-label="Navigasi footer">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="text-sm text-muted-foreground">
            <p>Kontak</p>
            <a href="mailto:hello@medknowledge.ai" className="text-primary hover:underline">
              hello@medknowledge.ai
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} MedKnowledge AI. Seluruh hak cipta dilindungi.</p>
          <p className="max-w-xl sm:text-right">
            MedKnowledge AI adalah platform pendukung pengetahuan klinis dan bukan pengganti
            penilaian tenaga kesehatan profesional.
          </p>
        </div>
      </SectionContainer>
    </footer>
  )
}
