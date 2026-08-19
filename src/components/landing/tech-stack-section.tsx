import { SectionContainer } from "@/components/landing/landing-shared"

const LAYERS = [
  { name: "Next.js / React", role: "Product surface" },
  { name: "Laravel 13", role: "Orchestration & business logic (BFF)" },
  { name: "FastAPI AI Service", role: "Sole gateway to AI/ML — nothing else calls a model directly" },
  { name: "LiteLLM → OpenAI GPT-4o / GPT-4o-mini", role: "Model routing & reasoning" },
  { name: "PostgreSQL / TimescaleDB", role: "System of record & immutable audit trail" },
  { name: "Qdrant / Elasticsearch", role: "Semantic & keyword retrieval" },
  { name: "MinIO", role: "Private source-document storage" },
  { name: "HAPI FHIR (R4)", role: "Clinical interoperability layer" },
  { name: "Laravel Reverb", role: "Realtime collaboration & notifications" },
]

export function TechStackSection() {
  return (
    <section id="teknologi" className="bg-muted/30 py-24 sm:py-32">
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-20">
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground text-balance">
              One AI gateway, nine services
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Laravel menangani orkestrasi; setiap permintaan AI wajib melalui satu FastAPI
              service — tidak ada jalur langsung ke penyedia model. Setiap baris di sini sudah
              berjalan, bukan rencana arsitektur.
            </p>
          </div>

          <div className="relative border-l border-border pl-6 sm:pl-8">
            {LAYERS.map((layer, index) => (
              <div
                key={layer.name}
                className={`relative py-4 ${index !== 0 ? "border-t border-border" : ""}`}
              >
                <span
                  className="absolute top-1/2 -left-[calc(1.5rem+1px)] h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary sm:-left-[calc(2rem+1px)]"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="font-mono text-[13px] text-foreground sm:w-[19rem] sm:shrink-0">
                    {layer.name}
                  </span>
                  <span className="text-sm text-muted-foreground">{layer.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
