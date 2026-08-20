"use client";

import { useEffect, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Annotation, Paginated } from "@/lib/types";

const SEVERITY_TONE: Record<string, StatusTone> = {
  contraindicated: "destructive",
  major: "warning",
  moderate: "warning",
  minor: "muted",
};

export default function KnowledgeRepositoryPage() {
  const [annotations, setAnnotations] = useState<Annotation[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const search = query ? `?drug=${encodeURIComponent(query)}` : "";
        const data = await apiFetch<Paginated<Annotation>>(`/knowledge-repository${search}`);
        setAnnotations(data.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load knowledge repository.");
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
            Catalog of published, FHIR-synced drug interactions across all projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drug name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          {annotations === null && !error && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {annotations && (
          <div className="divide-y divide-border">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {annotation.extraction.drug_a?.canonical_name} × {annotation.extraction.drug_b?.canonical_name}
                  </span>
                  {annotation.extraction.severity_schema && (
                    <StatusBadge
                      tone={SEVERITY_TONE[annotation.extraction.severity_schema.code] ?? "muted"}
                      className="capitalize"
                    >
                      {annotation.extraction.severity_schema.code}
                    </StatusBadge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{annotation.project.name}</p>
                <div
                  className="text-xs text-muted-foreground line-clamp-3 [&_p]:mb-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(annotation.content) }}
                />
              </div>
            ))}
            {annotations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No published interactions match this search.
              </p>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
