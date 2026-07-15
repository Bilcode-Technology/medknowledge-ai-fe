"use client";

import { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, Sparkles, Layers, Pill } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import type { EnterpriseSearchResult, SemanticSearchResult } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = {
  keyword: "Keyword",
  semantic: "Semantic",
};

const ENTITY_LABEL: Record<string, string> = {
  annotation: "Annotation",
  drug_entity: "Drug Entity",
};

function scorePercent(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

type AnnotationEntityData = {
  annotation_id: number;
  project_id: number;
  project_name?: string;
  drug_a: string;
  drug_b: string;
  content: string;
};

type DrugEntityData = {
  drug_entity_id: number;
  canonical_name: string;
  synonyms: string[] | null;
  kfa_code: string | null;
  rxnorm_code: string | null;
  atc_code: string | null;
};

export default function SearchPage() {
  const [queryInput, setQueryInput] = useState("");
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [enterpriseResults, setEnterpriseResults] = useState<EnterpriseSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function runSearch(event?: React.FormEvent) {
    event?.preventDefault();
    const q = queryInput.trim();
    setError(null);

    if (!q) {
      setError("Enter a search term first.");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const [semanticData, enterpriseData] = await Promise.all([
        apiFetch<SemanticSearchResult[]>(`/knowledge-repository/semantic-search?q=${encodeURIComponent(q)}`),
        apiFetch<EnterpriseSearchResult[]>(`/enterprise-search?q=${encodeURIComponent(q)}`),
      ]);
      setSemanticResults(semanticData);
      setEnterpriseResults(enterpriseData);
    } catch (err) {
      if (err instanceof ApiError) {
        const validationMessage = err.errors ? Object.values(err.errors).flat().join(" ") : null;
        setError(validationMessage || err.message);
      } else {
        setError("Failed to perform search.");
      }
      setSemanticResults([]);
      setEnterpriseResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <ProtectedShell breadcrumb="Search">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SearchIcon className="h-4 w-4 text-primary" /> Knowledge Search (M36 + M47)
          </CardTitle>
          <CardDescription className="text-xs">
            Search drug interactions across the entire knowledge base using semantic &amp; combined (keyword + semantic) search.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={runSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. warfarin amiodarone"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" disabled={isSearching} className="gap-1">
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>
          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-info" /> Semantic Search
          </CardTitle>
          <CardDescription className="text-xs">Results based on meaning similarity (vector similarity) from the knowledge repository.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {semanticResults.map((result) => (
              <div key={result.annotation.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/annotations/${result.annotation.id}`} className="text-sm font-semibold text-foreground hover:text-primary">
                    {result.annotation.extraction.drug_a?.canonical_name ?? result.annotation.extraction.raw_drug_a_text}
                    {" × "}
                    {result.annotation.extraction.drug_b?.canonical_name ?? result.annotation.extraction.raw_drug_b_text}
                  </Link>
                  <Badge className="bg-info/10 text-info border-info/20 text-[10px]">Score {scorePercent(result.score)}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{result.annotation.project?.name ?? "-"}</p>
                {/* annotation.content di sini adalah field Annotation mentah (HTML), beda dengan
                    data.content di enterprise-search yang sudah di-strip_tags() server-side —
                    jadi tetap perlu sanitize_html (DOMPurify) sebelum dirender sebagai HTML,
                    bukan teks polos, sama seperti pola di knowledge-repository/page.tsx. */}
                <div
                  className="text-xs text-muted-foreground line-clamp-3 [&_p]:mb-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.annotation.content) }}
                />
              </div>
            ))}
            {hasSearched && !isSearching && semanticResults.length === 0 && !error && (
              <p className="text-xs text-muted-foreground text-center py-8">No semantic search results.</p>
            )}
            {!hasSearched && (
              <p className="text-xs text-muted-foreground text-center py-8">Enter a search term to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-success" /> Combined Search
          </CardTitle>
          <CardDescription className="text-xs">Combined keyword (Elasticsearch) &amp; semantic (Qdrant) results across entities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {enterpriseResults.map((result, index) => {
              const key = `${result.entity_type}-${result.source}-${index}`;
              const badges = (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
                    {ENTITY_LABEL[result.entity_type] ?? result.entity_type}
                  </Badge>
                  <Badge
                    className={`text-[10px] ${
                      result.source === "semantic"
                        ? "bg-info/10 text-info border-info/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }`}
                  >
                    {SOURCE_LABEL[result.source] ?? result.source}
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    Score {scorePercent(result.score)}
                  </Badge>
                </div>
              );

              if (result.entity_type === "annotation") {
                const data = result.data as unknown as AnnotationEntityData;
                return (
                  <div key={key} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/annotations/${data.annotation_id}`} className="text-sm font-semibold text-foreground hover:text-primary">
                        {data.drug_a} × {data.drug_b}
                      </Link>
                      {badges}
                    </div>
                    {data.project_name && <p className="text-[11px] text-muted-foreground">{data.project_name}</p>}
                    <p className="text-xs text-muted-foreground line-clamp-3">{data.content}</p>
                  </div>
                );
              }

              const data = result.data as unknown as DrugEntityData;
              return (
                <div key={key} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Pill className="h-3.5 w-3.5 text-muted-foreground" /> {data.canonical_name}
                    </span>
                    {badges}
                  </div>
                  {data.synonyms && data.synonyms.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">Synonyms: {data.synonyms.join(", ")}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span>KFA: {data.kfa_code ?? "-"}</span>
                    <span>RxNorm: {data.rxnorm_code ?? "-"}</span>
                    <span>ATC: {data.atc_code ?? "-"}</span>
                  </div>
                </div>
              );
            })}
            {hasSearched && !isSearching && enterpriseResults.length === 0 && !error && (
              <p className="text-xs text-muted-foreground text-center py-8">No combined search results.</p>
            )}
            {!hasSearched && (
              <p className="text-xs text-muted-foreground text-center py-8">Enter a search term to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
