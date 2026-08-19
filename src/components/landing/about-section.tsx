import { SectionContainer } from "@/components/landing/landing-shared"

export function AboutSection() {
  return (
    <section className="py-24 sm:py-32">
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-20">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground text-balance">
            A governance platform, not a chatbot
          </h2>

          <div className="max-w-[65ch] space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              MedKnowledge AI adalah platform internal bagi institusi kesehatan untuk mengubah
              dokumen sumber &mdash; jurnal, panduan klinis, referensi farmakologi &mdash; menjadi
              entri interaksi obat yang terverifikasi. Setiap kandidat interaksi diekstrak AI dari
              dokumen yang diunggah, dipetakan ke standar terminologi nasional dan internasional
              (KFA Kemenkes, RxNorm, ATC), direview berlapis oleh apoteker dan reviewer senior,
              lalu dipublikasikan sebagai resource FHIR yang siap diintegrasikan ke sistem EHR
              atau peresepan elektronik.
            </p>
            <p>
              Platform ini dirancang untuk tim farmasi klinis, terminologist, dan reviewer di
              dalam institusi kesehatan &mdash;{" "}
              <span className="font-medium text-foreground">
                bukan aplikasi tanya-jawab kesehatan untuk masyarakat umum
              </span>
              .
            </p>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
