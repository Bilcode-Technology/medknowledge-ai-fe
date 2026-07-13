"use client";

import { useEffect, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Annotation, Paginated } from "@/lib/types";

const SEVERITY_STYLE: Record<string, string> = {
  contraindicated: "bg-red-500/10 text-red-400 border-red-500/20",
  major: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  minor: "bg-slate-800 text-slate-300 border-slate-700",
};

export default function KnowledgeRepositoryPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const search = query ? `?drug=${encodeURIComponent(query)}` : "";
        const data = await apiFetch<Paginated<Annotation>>(`/knowledge-repository${search}`);
        setAnnotations(data.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Gagal memuat knowledge repository.");
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <ProtectedShell breadcrumb="Knowledge Repository">
      <Card className="bg-slate-950/70 border-slate-900">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-400" /> Knowledge Repository (M35)
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Katalog interaksi obat yang sudah published &amp; tersinkron FHIR, lintas seluruh proyek.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Cari nama obat..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 bg-slate-900 border-slate-800 text-xs"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="rounded-lg border border-slate-900 bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {annotation.extraction.drug_a?.canonical_name} × {annotation.extraction.drug_b?.canonical_name}
                  </span>
                  {annotation.extraction.severity_schema && (
                    <Badge className={`${SEVERITY_STYLE[annotation.extraction.severity_schema.code] ?? SEVERITY_STYLE.minor} text-[10px] capitalize`}>
                      {annotation.extraction.severity_schema.code}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{annotation.project.name}</p>
                <div
                  className="text-xs text-slate-300 line-clamp-3 [&_p]:mb-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(annotation.content) }}
                />
              </div>
            ))}
            {annotations.length === 0 && !error && (
              <p className="text-xs text-slate-500 col-span-2 text-center py-8">
                Belum ada interaksi published yang cocok dengan pencarian.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
