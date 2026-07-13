// M16 — pemetaan koordinat text-layer PDF.js untuk highlight bukti sitasi.
//
// Fungsi di sini murni (tanpa DOM/pdfjs-dist runtime) supaya bisa dites lewat
// skrip Node biasa (lihat scripts verifikasi M16), dan dipakai ulang oleh
// PdfCanvasViewer untuk merender kotak highlight di atas kanvas.
//
// Alur:
// 1. Gabungkan seluruh `str` dari text-content items satu halaman jadi satu
//    string panjang, sambil mencatat item pemilik tiap karakter (pdf.js sering
//    memecah satu baris jadi banyak item kecil per kata/glyph-run).
// 2. Normalisasi whitespace pada string gabungan itu maupun pada citation_text
//    (collapse spasi/newline berurutan jadi satu spasi) — teks hasil OCR (M10)
//    dan text-layer asli PDF adalah dua ekstraksi independen dari dokumen yang
//    sama, jadi bisa berbeda spasi/baris meski isinya sama.
// 3. Cari substring citation (case-insensitive) di teks halaman yang sudah
//    dinormalisasi, lalu petakan rentang karakter yang cocok itu balik ke
//    index string gabungan asli, lalu ke daftar text item yang tercakup.
// 4. Untuk tiap item yang cocok, hitung 4 sudut kotaknya di ruang PDF (dari
//    transform + width/height, dengan vektor arah sumbu lokal supaya tetap
//    benar walau teks diputar), lalu proyeksikan ke ruang viewport lewat
//    `viewport.convertToViewportPoint` — pola konversi koordinat yang sama
//    dipakai TextLayer bawaan pdf.js.
//
// Kalau citation tidak ditemukan sama sekali (mis. teks OCR meleset jauh dari
// text-layer PDF), fungsi ini mengembalikan array kosong — tidak pernah throw.

export type PdfTextItemLike = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
};

export type PdfViewportLike = {
  width: number;
  height: number;
  convertToViewportPoint(x: number, y: number): number[];
};

export type HighlightRectPercent = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

// Collapse semua whitespace (spasi, tab, newline) berurutan jadi satu spasi,
// buang whitespace di awal/akhir, dan kembalikan peta index: normalized[i]
// berasal dari source[indexMap[i]].
function normalizeWithIndexMap(source: string): { normalized: string; indexMap: number[] } {
  let normalized = "";
  const indexMap: number[] = [];
  let lastWasSpace = true; // true di awal supaya whitespace leading ikut ter-skip

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      if (!lastWasSpace) {
        normalized += " ";
        indexMap.push(i);
        lastWasSpace = true;
      }
    } else {
      normalized += ch;
      indexMap.push(i);
      lastWasSpace = false;
    }
  }

  if (normalized.endsWith(" ")) {
    normalized = normalized.slice(0, -1);
    indexMap.pop();
  }

  return { normalized, indexMap };
}

export function normalizeWhitespace(source: string): string {
  return normalizeWithIndexMap(source).normalized;
}

type PageTextIndex = {
  // String gabungan seluruh item.str, apa adanya (belum dinormalisasi).
  rawText: string;
  // owners[i] = index item pemilik karakter rawText[i], atau -1 untuk
  // separator sintetis (mis. newline hasil hasEOL) yang tidak dimiliki item.
  owners: number[];
};

function buildPageTextIndex(items: PdfTextItemLike[]): PageTextIndex {
  let rawText = "";
  const owners: number[] = [];

  items.forEach((item, idx) => {
    for (const ch of item.str) {
      rawText += ch;
      owners.push(idx);
    }
    if (item.hasEOL) {
      rawText += "\n";
      owners.push(-1);
    }
  });

  return { rawText, owners };
}

// Cari citationText di kumpulan text items satu halaman. Mengembalikan index
// item (urut, unik) yang tercakup rentang kecocokan, atau null kalau tidak
// ada kecocokan sama sekali.
export function findMatchingItemIndexes(items: PdfTextItemLike[], citationText: string): number[] | null {
  const trimmedCitation = citationText.trim();
  if (!trimmedCitation || items.length === 0) return null;

  const { rawText, owners } = buildPageTextIndex(items);
  const { normalized: normalizedPage, indexMap } = normalizeWithIndexMap(rawText);
  const normalizedCitation = normalizeWhitespace(trimmedCitation);
  if (!normalizedCitation) return null;

  const matchStart = normalizedPage.toLowerCase().indexOf(normalizedCitation.toLowerCase());
  if (matchStart === -1) return null;

  const matchEnd = matchStart + normalizedCitation.length - 1;
  const rawStart = indexMap[matchStart];
  const rawEnd = indexMap[matchEnd];
  if (rawStart === undefined || rawEnd === undefined) return null;

  const itemIndexes = new Set<number>();
  for (let i = rawStart; i <= rawEnd; i++) {
    const owner = owners[i];
    if (owner >= 0) itemIndexes.add(owner);
  }
  if (itemIndexes.size === 0) return null;

  return Array.from(itemIndexes).sort((a, b) => a - b);
}

// Sudut kotak item di ruang PDF (user space), dihitung dari transform +
// width/height. xDir/yDir adalah arah sumbu lokal item (dinormalisasi ke unit
// vector) supaya rotasi teks tetap dihitung benar — width/height pdf.js sudah
// dalam satuan ruang-PDF (bukan unit-space), jadi tinggal digeser sepanjang
// arah sumbu lokal, bukan ditransformasi ulang lewat matrix penuh.
function itemCornersInPdfSpace(item: PdfTextItemLike): [number, number][] {
  const [a, b, c, d, e, f] = item.transform;
  const xLen = Math.hypot(a, b) || 1;
  const yLen = Math.hypot(c, d) || 1;
  const xDir: [number, number] = [a / xLen, b / xLen];
  const yDir: [number, number] = [c / yLen, d / yLen];
  const w = item.width;
  const h = item.height;

  const p0: [number, number] = [e, f];
  const p1: [number, number] = [e + xDir[0] * w, f + xDir[1] * w];
  const p2: [number, number] = [e + yDir[0] * h, f + yDir[1] * h];
  const p3: [number, number] = [e + xDir[0] * w + yDir[0] * h, f + xDir[1] * w + yDir[1] * h];
  return [p0, p1, p2, p3];
}

function rectForItem(item: PdfTextItemLike, viewport: PdfViewportLike): HighlightRectPercent {
  const corners = itemCornersInPdfSpace(item).map(([x, y]) => viewport.convertToViewportPoint(x, y));
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);

  return {
    leftPct: (left / viewport.width) * 100,
    topPct: (top / viewport.height) * 100,
    widthPct: ((right - left) / viewport.width) * 100,
    heightPct: ((bottom - top) / viewport.height) * 100,
  };
}

// API utama: dari text items satu halaman + viewport render + citation_text,
// hasilkan kotak-kotak highlight (dalam persen, relatif ke ukuran viewport)
// yang tinggal ditaruh sebagai overlay absolute di atas kanvas. Tidak pernah
// throw — kalau tidak ada kecocokan, kembalikan array kosong.
export function computeHighlightRects(
  items: PdfTextItemLike[],
  viewport: PdfViewportLike,
  citationText: string | null | undefined,
): HighlightRectPercent[] {
  if (!citationText) return [];
  try {
    const matchedIndexes = findMatchingItemIndexes(items, citationText);
    if (!matchedIndexes) return [];
    return matchedIndexes
      .map((idx) => rectForItem(items[idx], viewport))
      .filter((rect) => rect.widthPct > 0 && rect.heightPct > 0);
  } catch {
    // Data text-content tidak terduga (mis. transform malformed) — jangan
    // sampai merusak seluruh viewer hanya karena highlight gagal dihitung.
    return [];
  }
}
