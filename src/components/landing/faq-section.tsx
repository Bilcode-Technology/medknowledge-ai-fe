import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SectionContainer } from "@/components/landing/landing-shared"

const FAQ_ITEMS = [
  {
    question: "Dari mana AI mendapatkan informasinya?",
    answer:
      "Hanya dari dokumen sumber yang diunggah ke dalam proyek — bukan menjelajah internet secara bebas. Setiap hasil ekstraksi disertai sitasi ke paragraf sumber aslinya.",
  },
  {
    question: "Apakah hasilnya bisa dijadikan diagnosis?",
    answer:
      "Tidak. MedKnowledge AI bukan alat diagnosis dan bukan pengganti keputusan tenaga kesehatan. Platform ini mendukung, bukan menggantikan, penilaian klinis profesional.",
  },
  {
    question: "Siapa target pengguna platform ini?",
    answer:
      "Tim internal institusi kesehatan yang mengelola pengetahuan klinis: Pharmacist Reviewer, Terminologist, Senior Reviewer, FHIR Engineer, Project Manager, dan Administrator.",
  },
  {
    question: "Bagaimana keamanan datanya?",
    answer:
      "Role-based access control dengan delapan peran, audit trail immutable (hash-chained), dan dokumen sumber di object storage privat yang hanya bisa diakses lewat endpoint terautentikasi.",
  },
  {
    question: "Bagaimana cara mulai menggunakannya?",
    answer:
      "Tidak ada pendaftaran mandiri — akun dibuat oleh administrator institusi Anda. Hubungi tim kami untuk menjadwalkan demo dan diskusi implementasi.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <SectionContainer className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground text-balance">
          Frequently asked questions
        </h2>

        <Accordion className="mt-10 border-t border-border">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionPanel>{item.answer}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionContainer>
    </section>
  )
}
