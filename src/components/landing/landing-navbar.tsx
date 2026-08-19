"use client"

import { useState } from "react"
import Link from "next/link"
import { Cpu, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { SectionContainer, DEMO_MAILTO } from "@/components/landing/landing-shared"

const NAV_LINKS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Teknologi", href: "#teknologi" },
  { label: "Keunggulan", href: "#keunggulan" },
  { label: "FAQ", href: "#faq" },
]

function Logo() {
  return (
    <Link href="#beranda" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_oklch(0.46_0.09_200_/_0.25)]">
        <Cpu className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="text-sm font-semibold tracking-wide text-foreground">MedKnowledge AI</span>
        <span className="text-[10px] font-medium tracking-wider text-primary uppercase">Clinical Knowledge</span>
      </div>
    </Link>
  )
}

// CTA berbeda tergantung status login (bukan mengubah auth logic, hanya
// membaca useAuth() secara read-only) — user yang sudah punya akun langsung
// diarahkan ke dashboard, bukan disodori "Minta Demo"/"Masuk" lagi.
function NavCtas({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="h-8 w-40" aria-hidden="true" />
  }

  if (user) {
    return (
      <Button render={<Link href="/dashboard" onClick={onNavigate} />} nativeButton={false} size="sm">
        Buka Dashboard
      </Button>
    )
  }

  return (
    <>
      <Button
        render={<Link href="/login" onClick={onNavigate} />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Masuk
      </Button>
      <Button render={<a href={DEMO_MAILTO} onClick={onNavigate} />} nativeButton={false} size="sm">
        Minta Demo
      </Button>
    </>
  )
}

export function LandingNavbar() {
  const [isMenuOpen, setMenuOpen] = useState(false)

  return (
    <header className="landing-light sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <SectionContainer className="flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <NavCtas />
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
          aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </SectionContainer>

      {isMenuOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <SectionContainer className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
              <NavCtas onNavigate={() => setMenuOpen(false)} />
            </div>
          </SectionContainer>
        </div>
      )}
    </header>
  )
}
