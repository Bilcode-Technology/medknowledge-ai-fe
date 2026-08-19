import { SectionContainer } from "@/components/landing/landing-shared"

const MECHANISMS = [
  ["Human-in-the-loop", "AI tidak pernah mempublikasikan sendiri — setiap entri melalui Pharmacist dan Senior Review."],
  ["Role-based access", "Delapan peran granular, masing-masing dengan hak akses spesifik per aksi."],
  ["Immutable audit trail", "Tabel append-only dengan hash chain — dicatat, tidak pernah diubah atau dihapus."],
  ["Private object storage", "Dokumen sumber hanya bisa diakses lewat endpoint streaming yang terautentikasi."],
  ["Server-side sanitization", "Draf AI disaring sebelum disimpan — tidak ada HTML mentah yang lolos ke penyimpanan."],
  ["AI Gateway Pattern", "Backend tidak pernah memanggil model AI secara langsung; satu jalur, satu titik audit."],
]

export function TrustSection() {
  return (
    <section id="keunggulan" className="py-24 sm:py-32">
      <SectionContainer>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-20">
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground text-balance">
              Built on human review, not full automation
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Setiap entri interaksi obat punya sitasi yang tertelusuri ke sumber aslinya —
              bukan jawaban tanpa rujukan. Interoperabilitas FHIR adalah bagian inti alur kerja,
              bukan fitur ekspor tambahan di kemudian hari.
            </p>
          </div>

          <div>
            <dl className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
              {MECHANISMS.map(([term, definition]) => (
                <div key={term}>
                  <dt className="text-sm font-semibold text-foreground">{term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {definition}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 border border-border p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Disclaimer</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                MedKnowledge AI bukan alat diagnosis dan bukan pengganti keputusan tenaga
                kesehatan. Platform ini menghasilkan pengetahuan interaksi obat yang telah
                diverifikasi manusia untuk mendukung, bukan menggantikan, penilaian klinis
                profesional.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
