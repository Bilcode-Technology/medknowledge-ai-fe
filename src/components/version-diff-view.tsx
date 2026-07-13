"use client";

import { useMemo } from "react";
import { diffWordsWithSpace } from "diff";

// M28 — "Track Changes" diinterpretasikan sebagai diff word-level antar dua versi
// (bukan live collaborative editing ala Google Docs — itu butuh TipTap Pro atau
// server Y.js/Hocuspocus, di luar proporsi untuk workflow review async/multi-tahap
// ini). Reviewer memilih dua versi (termasuk konten live saat ini), lalu di sini
// tampil satu paragraf: bagian yang sama apa adanya, bagian yang dihapus dicoret
// merah, bagian yang ditambah digarisbawahi hijau.

// Konten annotation adalah HTML (TipTap output) yang sudah disanitasi server &
// client (lihat lib/sanitize.ts). Diff kata-per-kata jauh lebih berguna untuk
// prosa kalau dilakukan atas teks polos, bukan markup — jadi tag di-strip dulu.
// DOMParser dipakai (bukan regex) supaya entity HTML (&amp;, &nbsp;, dst.) ikut
// didekode dengan benar; komponen ini "use client" jadi DOMParser selalu tersedia.
function stripHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function VersionDiffView({ oldContent, newContent }: { oldContent: string; newContent: string }) {
  const parts = useMemo(() => {
    const oldText = stripHtml(oldContent);
    const newText = stripHtml(newContent);
    return diffWordsWithSpace(oldText, newText);
  }, [oldContent, newContent]);

  const hasChanges = parts.some((part) => part.added || part.removed);

  return (
    <div className="space-y-2">
      {!hasChanges && <p className="text-xs text-muted-foreground">Tidak ada perbedaan teks antara kedua versi ini.</p>}
      <p className="text-xs leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (part.removed) {
            return (
              <span key={index} className="bg-destructive/10 text-destructive line-through">
                {part.value}
              </span>
            );
          }
          if (part.added) {
            return (
              <span key={index} className="bg-success/10 text-success underline">
                {part.value}
              </span>
            );
          }
          return <span key={index}>{part.value}</span>;
        })}
      </p>
    </div>
  );
}
