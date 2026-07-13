"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

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
};

export default function PdfCanvasViewer({ data, pageNumber, onNumPages, onError }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [isRendering, setIsRendering] = useState(false);

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
        currentRenderTask = page.render({ canvasContext: context, viewport });
        await currentRenderTask.promise;
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

  return (
    <div className="relative flex justify-center py-2">
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-muted-foreground z-10">
          Merender halaman...
        </div>
      )}
      <canvas ref={canvasRef} className="max-w-full border border-border shadow-sm bg-white" />
    </div>
  );
}
