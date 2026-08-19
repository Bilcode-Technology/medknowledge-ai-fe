import { SectionContainer, ArtifactCaption } from "@/components/landing/landing-shared"

type Stage = {
  n: string
  title: string
  description: string
  artifact?: React.ReactNode
}

function ReviewChecklistArtifact() {
  const items = [
    ["Interaction confirmed in source", true],
    ["No missed interactions", true],
    ["Severity & evidence grade finalized", true],
    ["Citation validated", true],
  ] as const

  return (
    <div className="mt-5 max-w-md border-t border-foreground/15 pt-5">
      <ul className="space-y-2.5 text-sm">
        {items.map(([label]) => (
          <li key={label} className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-primary">&#10003;</span>
            <span className="text-foreground/80">{label}</span>
          </li>
        ))}
      </ul>
      <ArtifactCaption>Pharmacist Review checklist &mdash; all four points required to approve.</ArtifactCaption>
    </div>
  )
}

function FhirResourceArtifact() {
  return (
    <div className="mt-5 max-w-md border-t border-foreground/15 pt-5">
      <pre className="overflow-x-auto font-mono text-[12.5px] leading-relaxed text-foreground/80">
{`DetectedIssue
  status:    final
  severity:  high
  implicated: Warfarin, Amiodarone
  detail:    ClinicalUseDefinition/wa-amd-001`}
      </pre>
      <ArtifactCaption>Synced to a live HAPI FHIR R4 server on publish.</ArtifactCaption>
    </div>
  )
}

const STAGES: Stage[] = [
  {
    n: "01",
    title: "Literature",
    description: "Dokumen sumber (jurnal, panduan klinis) diunggah dan metadatanya divalidasi.",
  },
  {
    n: "02",
    title: "Extraction",
    description:
      "AI mengekstrak kandidat interaksi dari dokumen dengan confidence score dan sitasi paragraf sumber.",
  },
  {
    n: "03",
    title: "Verification",
    description:
      "Kandidat dengan confidence di bawah ambang atau tanpa sitasi valid otomatis ditolak sebelum sampai ke reviewer.",
  },
  {
    n: "04",
    title: "Clinical Review",
    description:
      "Pharmacist Reviewer memverifikasi lewat checklist terstruktur; Senior Reviewer memberi persetujuan akhir.",
    artifact: <ReviewChecklistArtifact />,
  },
  {
    n: "05",
    title: "Standardization",
    description: "Entitas obat dipetakan ke kode KFA Kemenkes, RxNorm, dan ATC.",
  },
  {
    n: "06",
    title: "FHIR Publishing",
    description:
      "Entri yang disetujui disinkronkan sebagai ClinicalUseDefinition, MedicationKnowledge, dan DetectedIssue.",
    artifact: <FhirResourceArtifact />,
  },
  {
    n: "07",
    title: "Search & API",
    description:
      "Tersedia lewat pencarian semantik + kata kunci gabungan, dan lewat API pengecekan interaksi untuk sistem EHR.",
  },
  {
    n: "08",
    title: "Auditability",
    description: "Setiap aksi tercatat di tabel append-only dengan hash chain &mdash; tidak bisa diubah.",
  },
]

export function PipelineSection() {
  return (
    <section id="fitur" className="py-24 sm:py-32">
      <SectionContainer>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground text-balance">
            The clinical knowledge pipeline
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Delapan tahap dari dokumen mentah hingga pengetahuan siap-FHIR. Setiap tahap sudah
            berjalan pada platform &mdash; bukan rencana pengembangan.
          </p>
        </div>

        <div id="cara-kerja" className="mt-14 border-t border-border">
          {STAGES.map((stage) => (
            <div
              key={stage.n}
              className="reveal-row grid grid-cols-[3rem_1fr] gap-x-6 border-b border-border py-7 sm:grid-cols-[4rem_minmax(0,26rem)_1fr] sm:gap-x-10"
            >
              <span className="font-mono text-sm text-muted-foreground/60 tabular-nums">
                {stage.n}
              </span>
              <h3 className="text-base font-semibold text-foreground sm:col-start-2">
                {stage.title}
              </h3>
              <div className="col-span-2 mt-2 sm:col-span-1 sm:col-start-3 sm:mt-0">
                <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                  {stage.description}
                </p>
                {stage.artifact}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
