"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, FileText, Quote } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, apiFetchBlob, ApiError } from "@/lib/api";
import type { Extraction, Paginated, Source } from "@/lib/types";

// pdfjs-dist menyentuh API browser (Worker, canvas) begitu di-import — ssr:
// false supaya modul ini tidak pernah dievaluasi di sisi server saat build/SSR.
const PdfCanvasViewer = dynamic(() => import("@/components/pdf-canvas-viewer"), {
  ssr: false,
  loading: () => <p className="text-xs text-muted-foreground text-center py-10">Loading PDF.js...</p>,
});

export default function SourcePdfViewerPage({ params }: { params: Promise<{ id: string; sourceId: string }> }) {
  const { id, sourceId } = use(params);

  const [source, setSource] = useState<Source | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // M16 — citation_text ekstraksi yang sedang di-highlight di PDF, plus id
  // ekstraksinya (buat state visual "terpilih" di daftar kanan). Keduanya
  // di-reset begitu user pindah halaman lewat tombol Sebelumnya/Berikutnya,
  // supaya highlight lama tidak nyangkut di halaman yang tidak relevan.
  const [highlightedCitation, setHighlightedCitation] = useState<string | null>(null);
  const [highlightedExtractionId, setHighlightedExtractionId] = useState<number | null>(null);

  async function loadMetadata() {
    try {
      const [sourcesData, extractionsData] = await Promise.all([
        apiFetch<Paginated<Source>>(`/projects/${id}/sources`),
        apiFetch<Paginated<Extraction>>(`/projects/${id}/extractions`),
      ]);
      setSource(sourcesData.data.find((s) => String(s.id) === sourceId) ?? null);
      // Tidak ada endpoint khusus "extraction by source" di backend — filter
      // client-side dari daftar ekstraksi proyek (pola yang sama dipakai di
      // halaman lain untuk data yang belum punya endpoint tersaring).
      setExtractions(extractionsData.data.filter((extraction) => String(extraction.source?.id) === sourceId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load source/extraction data.");
    }
  }

  async function loadPdf() {
    setIsLoadingPdf(true);
    try {
      const blob = await apiFetchBlob(`/sources/${sourceId}/file`);
      const buffer = await blob.arrayBuffer();
      setPdfData(buffer);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load PDF file from server.");
    } finally {
      setIsLoadingPdf(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount/ganti id, bukan derivasi sinkron dari props
    loadMetadata();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount/ganti id, bukan derivasi sinkron dari props
    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sourceId]);

  function jumpToPage(page: number | null) {
    if (!page || page < 1) return;
    setPageNumber(page);
  }

  // M16 — klik ekstraksi: lompat ke halamannya SEKALIGUS set teks yang mau
  // di-highlight. Kalau extraction yang sama diklik lagi di halaman yang
  // sama, effect pencarian highlight di PdfCanvasViewer tetap jalan ulang
  // karena identitas string highlightText tidak berubah referensinya secara
  // otomatis dianggap "sama" oleh React — itu perilaku yang diinginkan, tidak
  // perlu redundant re-search.
  function handleSelectExtraction(extraction: Extraction) {
    if (!extraction.page_number) return;
    jumpToPage(extraction.page_number);
    setHighlightedCitation(extraction.citation_text ?? null);
    setHighlightedExtractionId(extraction.id);
  }

  // Navigasi manual (tombol Sebelumnya/Berikutnya) tidak terikat ke ekstraksi
  // manapun — bersihkan highlight supaya tidak nyangkut di halaman yang tidak
  // relevan dengan citation_text sebelumnya.
  function goToPage(next: number) {
    setPageNumber(next);
    setHighlightedCitation(null);
    setHighlightedExtractionId(null);
  }

  const documentTitle = source?.title ?? source?.original_filename ?? "Source Document";

  return (
    <ProtectedShell breadcrumb={`View PDF — ${documentTitle}`}>
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[calc(100vh-8.5rem)]">
        {/* Kiri — PDF.js Viewer (M15) */}
        <Card className="flex flex-col overflow-hidden lg:h-full">
          <CardHeader className="shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> {documentTitle}
            </CardTitle>
            <CardDescription className="text-xs">PDF.js Viewer (M15)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isLoadingPdf && <p className="text-xs text-muted-foreground text-center py-10">Loading PDF file...</p>}
            {!isLoadingPdf && pdfData && (
              <PdfCanvasViewer
                data={pdfData}
                pageNumber={pageNumber}
                onNumPages={setNumPages}
                onError={setError}
                highlightText={highlightedCitation}
              />
            )}
            {!isLoadingPdf && !pdfData && !error && (
              <p className="text-xs text-muted-foreground text-center py-10">PDF file not available.</p>
            )}
          </CardContent>
          <div className="shrink-0 flex items-center justify-center gap-3 border-t border-border p-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground min-w-32 text-center">
              Page {numPages > 0 ? pageNumber : "-"} of {numPages || "-"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(Math.min(numPages || pageNumber, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              className="gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* Kanan — Bukti Ekstraksi (M16) */}
        <Card className="flex flex-col overflow-hidden lg:h-full">
          <CardHeader className="shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Quote className="h-4 w-4 text-info" /> Extraction Evidence (M16)
            </CardTitle>
            <CardDescription className="text-xs">
              Click an extraction to jump to its page in the PDF and highlight the citation sentence position
              (mapped via PDF.js text-layer coordinates, M16). Note: OCR (M10) and the PDF&apos;s native text layer are
              two independent text extractions of the same document — if they differ significantly, text matching
              can miss and the highlight won&apos;t appear (page jump still works as usual).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3">
            {extractions.map((extraction) => (
              <button
                key={extraction.id}
                type="button"
                onClick={() => handleSelectExtraction(extraction)}
                disabled={!extraction.page_number}
                className={`w-full text-left rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60 space-y-1.5 ${
                  extraction.id === highlightedExtractionId ? "border-primary/50 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {extraction.drug_a?.canonical_name ?? extraction.raw_drug_a_text} ×{" "}
                    {extraction.drug_b?.canonical_name ?? extraction.raw_drug_b_text}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{extraction.confidence_score ?? "-"}%</span>
                </div>
                {extraction.mechanism && <p className="text-[11px] text-muted-foreground">{extraction.mechanism}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {extraction.severity_schema && (
                    <Badge variant="outline" className="text-[10px]">
                      {extraction.severity_schema.code}
                    </Badge>
                  )}
                  {extraction.evidence_grade && (
                    <Badge variant="outline" className="text-[10px]">
                      {extraction.evidence_grade.code}
                    </Badge>
                  )}
                  {extraction.page_number && (
                    <Badge className="bg-info/10 text-info border-info/20 text-[10px]">Page {extraction.page_number}</Badge>
                  )}
                </div>
                {extraction.citation_text && (
                  <p className="text-[11px] italic text-muted-foreground border-l-2 border-border pl-2">
                    &ldquo;{extraction.citation_text}&rdquo;
                  </p>
                )}
              </button>
            ))}
            {extractions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No extractions for this document yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedShell>
  );
}
