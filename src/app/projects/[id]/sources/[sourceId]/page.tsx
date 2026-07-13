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
  loading: () => <p className="text-xs text-muted-foreground text-center py-10">Memuat PDF.js...</p>,
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
      setError(err instanceof ApiError ? err.message : "Gagal memuat data sumber/ekstraksi.");
    }
  }

  async function loadPdf() {
    setIsLoadingPdf(true);
    try {
      const blob = await apiFetchBlob(`/sources/${sourceId}/file`);
      const buffer = await blob.arrayBuffer();
      setPdfData(buffer);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat berkas PDF dari server.");
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

  const documentTitle = source?.title ?? source?.original_filename ?? "Dokumen Sumber";

  return (
    <ProtectedShell breadcrumb={`Lihat PDF — ${documentTitle}`}>
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
            {isLoadingPdf && <p className="text-xs text-muted-foreground text-center py-10">Memuat berkas PDF...</p>}
            {!isLoadingPdf && pdfData && (
              <PdfCanvasViewer data={pdfData} pageNumber={pageNumber} onNumPages={setNumPages} onError={setError} />
            )}
            {!isLoadingPdf && !pdfData && !error && (
              <p className="text-xs text-muted-foreground text-center py-10">Berkas PDF tidak tersedia.</p>
            )}
          </CardContent>
          <div className="shrink-0 flex items-center justify-center gap-3 border-t border-border p-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground min-w-32 text-center">
              Halaman {numPages > 0 ? pageNumber : "-"} dari {numPages || "-"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
              disabled={pageNumber >= numPages}
              className="gap-1"
            >
              Berikutnya <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* Kanan — Bukti Ekstraksi (M16) */}
        <Card className="flex flex-col overflow-hidden lg:h-full">
          <CardHeader className="shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Quote className="h-4 w-4 text-info" /> Bukti Ekstraksi (M16)
            </CardTitle>
            <CardDescription className="text-xs">
              Klik sebuah ekstraksi untuk lompat ke halamannya di PDF. Catatan: lompatan ini hanya ke level halaman —
              menyorot posisi kalimat sitasi persis butuh pemetaan koordinat text-layer PDF.js yang belum diimplementasikan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3">
            {extractions.map((extraction) => (
              <button
                key={extraction.id}
                type="button"
                onClick={() => jumpToPage(extraction.page_number)}
                disabled={!extraction.page_number}
                className="w-full text-left rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60 space-y-1.5"
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
                    <Badge className="bg-info/10 text-info border-info/20 text-[10px]">Hal. {extraction.page_number}</Badge>
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
              <p className="text-xs text-muted-foreground text-center py-6">Belum ada ekstraksi untuk dokumen ini.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedShell>
  );
}
