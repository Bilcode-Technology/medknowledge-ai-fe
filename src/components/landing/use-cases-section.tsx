import { SectionContainer } from "@/components/landing/landing-shared"

const ROLES = [
  ["Pharmacist Reviewer", "Memverifikasi kandidat interaksi obat hasil ekstraksi AI sebelum masuk ke review senior."],
  ["Terminologist", "Memetakan entitas obat ke kode KFA Kemenkes, RxNorm, dan ATC."],
  ["Senior Reviewer / Clinical Arbitrator", "Memberikan persetujuan akhir, menyelesaikan kasus yang diperselisihkan."],
  ["FHIR Engineer", "Mengonsumsi resource FHIR dan API pengecekan interaksi untuk integrasi EHR."],
  ["Project Manager / Data Acquisition Officer", "Mengelola akuisisi dokumen sumber dan progres proyek."],
]

export function UseCasesSection() {
  return (
    <section className="py-24 sm:py-32">
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-20">
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground text-balance">
              Who works in the platform
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Setiap peran punya alur kerja dan hak akses tersendiri di dalam platform.
            </p>
          </div>

          <div className="border-t border-border">
            {ROLES.map(([role, description]) => (
              <div
                key={role}
                className="grid grid-cols-1 gap-1.5 border-b border-border py-5 sm:grid-cols-[16rem_1fr] sm:gap-6"
              >
                <span className="text-sm font-semibold text-foreground">{role}</span>
                <span className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
