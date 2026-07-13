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
  contraindicated: "bg-destructive/10 text-destructive border-destructive/20",
  major: "bg-warning/15 text-warning border-warning/25",
  moderate: "bg-warning/10 text-warning border-warning/20",
  minor: "bg-muted text-muted-foreground border-border",
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Knowledge Repository (M35)
          </CardTitle>
          <CardDescription className="text-xs">
            Katalog interaksi obat yang sudah published &amp; tersinkron FHIR, lintas seluruh proyek.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama obat..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="divide-y divide-border">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {annotation.extraction.drug_a?.canonical_name} × {annotation.extraction.drug_b?.canonical_name}
                  </span>
                  {annotation.extraction.severity_schema && (
                    <Badge className={`${SEVERITY_STYLE[annotation.extraction.severity_schema.code] ?? SEVERITY_STYLE.minor} text-[10px] capitalize`}>
                      {annotation.extraction.severity_schema.code}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{annotation.project.name}</p>
                <div
                  className="text-xs text-muted-foreground line-clamp-3 [&_p]:mb-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(annotation.content) }}
                />
              </div>
            ))}
            {annotations.length === 0 && !error && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Belum ada interaksi published yang cocok dengan pencarian.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
