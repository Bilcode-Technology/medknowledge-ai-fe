"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, PageViewport, RenderTask } from "pdfjs-dist";
import { computeHighlightRects, type HighlightRectPercent } from "@/lib/pdf-highlight";

// M15 — render PDF.js murni (bukan wrapper react-pdf, sesuai pilihan tech
// workbook). Worker di-load dari CDN cdnjs, dipin persis ke versi pdfjs-dist
// yang terpasang di package.json supaya API worker <-> main-thread cocok —
// worker bundel lokal lewat asset pipeline Next.js App Router lebih rawan
// salah konfigurasi untuk kasus ini.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type PdfCanvasViewerProps = {
  data: ArrayBuffer;
  pageNumber: number;
  onNumPages: (numPages: number) => void;
  onError: (message: string) => void;
  // M16 — kalau diisi, cari teks ini di text-layer halaman yang sedang
  // ditampilkan dan gambar kotak highlight di atasnya. null/undefined berarti
  // tidak ada highlight aktif.
  highlightText?: string | null;
};

export default function PdfCanvasViewer({ data, pageNumber, onNumPages, onError, highlightText }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  // Halaman + viewport yang sedang tampil di kanvas — disimpan terpisah dari
  // efek render supaya pencarian highlight (getTextContent) tidak perlu
  // nge-render ulang kanvas setiap kali highlightText berganti pada halaman
  // yang sama (mis. klik ekstraksi lain di halaman yang sama).
  const [renderedPage, setRenderedPage] = useState<{ page: PDFPageProxy; viewport: PageViewport } | null>(null);
  const [highlightRects, setHighlightRects] = useState<HighlightRectPercent[]>([]);

  // Muat dokumen sekali per perubahan byte PDF.
  useEffect(() => {
    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument({ data });
    loadingTask.promise
      .then((loadedDoc) => {
        if (cancelled) return;
        setDoc(loadedDoc);
        onNumPages(loadedDoc.numPages);
      })
      .catch((err) => {
        if (!cancelled) onError(err instanceof Error ? err.message : "Gagal memuat berkas PDF.");
      });
    return () => {
      cancelled = true;
      setDoc(null);
      setRenderedPage(null);
      loadingTask.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Render ulang halaman saat dokumen siap atau nomor halaman berubah.
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    let currentRenderTask: RenderTask | null = null;

    async function renderPage() {
      const safePage = Math.min(Math.max(pageNumber, 1), doc!.numPages);
      setIsRendering(true);
      try {
        const page = await doc!.getPage(safePage);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        currentRenderTask = page.render({ canvas, canvasContext: context, viewport });
        await currentRenderTask.promise;
        if (cancelled) return;
        // Simpan page+viewport supaya efek highlight di bawah bisa memanggil
        // getTextContent() tanpa perlu me-render ulang kanvas.
        setRenderedPage({ page, viewport });
      } catch (err) {
        // Membatalkan render task yang sedang berjalan (mis. navigasi halaman
        // cepat) memicu RenderingCancelledException — itu bukan error nyata.
        const isCancelled = err instanceof pdfjsLib.RenderingCancelledException;
        if (!cancelled && !isCancelled) {
          onError(err instanceof Error ? err.message : "Gagal merender halaman PDF.");
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    }

    renderPage();
    return () => {
      cancelled = true;
      currentRenderTask?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, pageNumber]);

  // M16 — cari citation_text di text-layer halaman yang sedang tampil begitu
  // renderedPage siap atau highlightText berganti (mis. user klik ekstraksi
  // lain di halaman yang sama). getTextContent() dipanggil di sini, terpisah
  // dari efek render kanvas di atas, supaya ganti highlight tidak memicu
  // render ulang kanvas.
  useEffect(() => {
    if (!renderedPage || !highlightText) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bersihkan highlight lama saat halaman/teks target hilang, bukan derivasi sinkron dari props
      setHighlightRects([]);
      return;
    }
    let cancelled = false;

    renderedPage.page
      .getTextContent()
      .then((textContent) => {
        if (cancelled) return;
        const items = textContent.items.filter(
          (item): item is Extract<typeof item, { str: string }> => "str" in item,
        );
        setHighlightRects(computeHighlightRects(items, renderedPage.viewport, highlightText));
      })
      .catch(() => {
        // getTextContent gagal (mis. halaman rusak) — jangan sampai
        // menjatuhkan seluruh viewer hanya karena highlight tidak bisa dicari.
        if (!cancelled) setHighlightRects([]);
      });

    return () => {
      cancelled = true;
    };
  }, [renderedPage, highlightText]);

  return (
    <div className="relative flex justify-center py-2">
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-muted-foreground z-10">
          Merender halaman...
        </div>
      )}
      <div className="relative inline-block leading-none">
        <canvas ref={canvasRef} className="max-w-full border border-border shadow-sm bg-white" />
        {highlightRects.length > 0 && (
          <div className="pointer-events-none absolute inset-0">
            {highlightRects.map((rect, idx) => (
              <div
                key={idx}
                className="absolute rounded-[2px] bg-yellow-300/40 ring-1 ring-yellow-500/70"
                style={{
                  left: `${rect.leftPct}%`,
                  top: `${rect.topPct}%`,
                  width: `${rect.widthPct}%`,
                  height: `${rect.heightPct}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
