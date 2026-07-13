import DOMPurify from "dompurify";

// M27 — lapisan kedua sanitasi di client (HTMLPurifier server-side di
// AnnotationController/GenerateAiDraft adalah lapisan pertama). Konten
// annotation SEHARUSNYA sudah bersih saat sampai di sini, tapi tidak boleh
// dipercaya begitu saja hanya karena datang dari API sendiri.
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "h1", "h2", "h3", "blockquote", "a", "table", "thead", "tbody", "tr", "td", "th"],
    ALLOWED_ATTR: ["href"],
  });
}
