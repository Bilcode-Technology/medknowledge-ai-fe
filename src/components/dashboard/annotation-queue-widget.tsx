"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { Annotation, Paginated } from "@/lib/types";

// Reused across Pharmacist Reviewer (status=draft), Senior Reviewer
// (status=senior_review), and Clinical Arbitrator (status=disputed) — all
// three are the same shape: "annotations sitting in my stage of the review
// pipeline, newest first." Backed by the existing GET /annotations?status=
// endpoint, which already returns cross-project results.
export function AnnotationQueueWidget({
  status,
  title,
  description,
  emptyMessage,
}: {
  status: string;
  title: string;
  description: string;
  emptyMessage: string;
}) {
  const [data, setData] = useState<Paginated<Annotation> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Paginated<Annotation>>(`/annotations?status=${status}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load queue.");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {data && (
          <Badge variant={data.total > 0 ? "warning" : "muted"} className="shrink-0">
            {data.total}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {!data && !error && (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {data && data.data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        )}

        {data && data.data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.data.map((item) => {
              const drugA = item.extraction?.drug_a?.canonical_name ?? item.extraction?.raw_drug_a_text;
              const drugB = item.extraction?.drug_b?.canonical_name ?? item.extraction?.raw_drug_b_text;
              return (
                <li key={item.id}>
                  <Link
                    href={`/annotations/${item.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium text-foreground">
                      {drugA} + {drugB}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
