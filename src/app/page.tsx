import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { PositioningStatement } from "@/components/landing/positioning-statement";
import { AboutSection } from "@/components/landing/about-section";
import { PipelineSection } from "@/components/landing/pipeline-section";
import { TechStackSection } from "@/components/landing/tech-stack-section";
import { TrustSection } from "@/components/landing/trust-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "MedKnowledge AI — Clinical Knowledge Intelligence Platform",
  description:
    "Platform tata kelola pengetahuan klinis berbasis AI: mengekstrak, memverifikasi, dan mempublikasikan interaksi obat sebagai resource FHIR untuk tim farmasi klinis institusi kesehatan.",
  openGraph: {
    title: "MedKnowledge AI — Clinical Knowledge Intelligence Platform",
    description:
      "Transforming medical literature into trusted, FHIR-native clinical decision knowledge.",
    type: "website",
  },
};

// Landing page publik — tidak dibungkus ProtectedShell (harus bisa diakses
// tanpa login). White-mode adalah default tunggal aplikasi (lihat
// globals.css) jadi tidak perlu scoping tema lokal di sini lagi.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Langsung ke konten
      </a>

      <LandingNavbar />

      <main id="main-content">
        <HeroSection />
        <PositioningStatement />
        <AboutSection />
        <PipelineSection />
        <TechStackSection />
        <TrustSection />
        <UseCasesSection />
        <FaqSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
