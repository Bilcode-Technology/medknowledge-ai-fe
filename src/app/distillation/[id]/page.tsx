"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2, Send, Sparkles, XCircle } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KfaIngredientPicker } from "@/components/kfa-ingredient-picker";
import { apiFetch, ApiError } from "@/lib/api";
import { MANAGEMENT_CATEGORY_LABELS, type DistillationRun, type Extraction } from "@/lib/types";

// M50 — hasil distilasi: satu kartu per interaksi berisi form 5-field
// ClinicalUseDefinition (interactant1/2 + KFA, effect, management, reference)
// yang bisa diedit sebelum dikonfirmasi ke jalur validasi apoteker (M29-M32).

type CardForm = {
  interactant1: string;
  kfaCodeA: string | null;
  interactant2: string;
  kfaCodeB: string | null;
  effect: string;
  management: string;
  managementCategory: string;
  reference: string;
  isSubmitting: boolean;
  error: string | null;
};

function formFromExtraction(extraction: Extraction): CardForm {
  return {
    interactant1: extraction.raw_drug_a_text,
    kfaCodeA: extraction.kfa_code_a ?? null,
    interactant2: extraction.raw_drug_b_text,
    kfaCodeB: extraction.kfa_code_b ?? null,
    effect: extraction.effect ?? "",
    management: extraction.management ?? "",
    managementCategory: extraction.management_category ?? "monitor_closely",
    reference: extraction.reference_text ?? "",
    isSubmitting: false,
    error: null,
  };
}

export default function DistillationRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [run, setRun] = useState<DistillationRun | null>(null);
  const [forms, setForms] = useState<Record<number, CardForm>>({});
  const [error, setError] = useState<string | null>(null);

  const loadRun = useCallback(async () => {
    try {
      const data = await apiFetch<DistillationRun>(`/distillations/${id}`);
      setRun(data);
      setForms((prev) => {
        const next = { ...prev };
        for (const extraction of data.extractions ?? []) {
          if (!next[extraction.id]) next[extraction.id] = formFromExtraction(extraction);
        }
        return next;
      });
      return data;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load distillation run.");
      return null;
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch + poll selama run belum selesai
    loadRun();
    const interval = setInterval(async () => {
      const data = await loadRun();
      if (data && (data.status === "completed" || data.status === "failed")) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadRun]);

  function patchForm(extractionId: number, patch: Partial<CardForm>) {
    setForms((prev) => ({ ...prev, [extractionId]: { ...prev[extractionId], ...patch } }));
  }

  async function confirm(extraction: Extraction) {
    const form = forms[extraction.id];
    if (!form) return;
    patchForm(extraction.id, { isSubmitting: true, error: null });
    try {
      await apiFetch(`/distillations/${id}/interactions/${extraction.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          interactant1: form.interactant1,
          interactant2: form.interactant2,
          effect: form.effect,
          management: form.management,
          management_category: form.managementCategory,
          reference: form.reference,
          kfa_code_a: form.kfaCodeA,
          kfa_code_b: form.kfaCodeB,
        }),
      });
      await loadRun();
    } catch (err) {
      patchForm(extraction.id, {
        isSubmitting: false,
        error: err instanceof ApiError ? err.message : "Failed to confirm interaction.",
      });
    }
  }

  const isBusy = run && (run.status === "queued" || run.status === "running");

  return (
    <ProtectedShell breadcrumb="AI Distillation">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Distillation: {run?.ingredient_name ?? "..."}
                  {run?.counterpart_name ? ` + ${run.counterpart_name}` : " (all interactions)"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Model {run?.model ?? "-"} · {run?.total_tokens ?? "-"} tokens · ${run?.cost_usd ?? "-"}
                </CardDescription>
              </div>
              {isBusy && (
                <Badge className="bg-info/10 text-info border-info/20 text-[10px] flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> AI is distilling...
                </Badge>
              )}
              {run?.status === "failed" && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Failed
                </Badge>
              )}
            </div>
          </CardHeader>
          {run?.status === "failed" && run.error && (
            <CardContent>
              <p className="text-xs text-destructive">{run.error}</p>
            </CardContent>
          )}
        </Card>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {run?.status === "completed" && (run.extractions ?? []).length === 0 && (
          <Card>
            <CardContent className="py-6">
              <p className="text-xs text-muted-foreground">The AI did not find any well-established interactions for this ingredient.</p>
            </CardContent>
          </Card>
        )}

        {(run?.extractions ?? []).map((extraction) => {
          const form = forms[extraction.id];
          if (!form) return null;
          const confirmed = Boolean(extraction.annotation);

          return (
            <Card key={extraction.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-sm">
                    {form.interactant1} + {form.interactant2}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {extraction.severity_schema && (
                      <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">
                        {extraction.severity_schema.code}
                      </Badge>
                    )}
                    {extraction.evidence_grade && (
                      <Badge className="bg-info/10 text-info border-info/20 text-[10px]">
                        Evidence {extraction.evidence_grade.code}
                      </Badge>
                    )}
                    {extraction.confidence_score && (
                      <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
                        Confidence {Number(extraction.confidence_score).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {confirmed ? (
                  <div className="flex items-center justify-between gap-4">
                    <Badge className="bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1 w-fit">
                      <CheckCircle2 className="h-3 w-3" /> Confirmed — sent for pharmacist validation
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link href={`/annotations/${extraction.annotation!.id}`} />}
                      className="gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open Annotation
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <KfaIngredientPicker
                        label="Interactant 1"
                        name={form.interactant1}
                        kfaCode={form.kfaCodeA}
                        onChange={(name, kfa) => patchForm(extraction.id, { interactant1: name, kfaCodeA: kfa })}
                      />
                      <KfaIngredientPicker
                        label="Interactant 2"
                        name={form.interactant2}
                        kfaCode={form.kfaCodeB}
                        onChange={(name, kfa) => patchForm(extraction.id, { interactant2: name, kfaCodeB: kfa })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Effect — clinical effect narrative</Label>
                      <Textarea
                        value={form.effect}
                        onChange={(e) => patchForm(extraction.id, { effect: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                      <div className="space-y-1.5">
                        <Label>Management — handling narrative</Label>
                        <Textarea
                          value={form.management}
                          onChange={(e) => patchForm(extraction.id, { management: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select
                          value={form.managementCategory}
                          onValueChange={(value) => patchForm(extraction.id, { managementCategory: value as string })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(MANAGEMENT_CATEGORY_LABELS).map(([code, label]) => (
                              <SelectItem key={code} value={code}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Reference — source attributed by the AI (must be verified)</Label>
                      <Textarea
                        value={form.reference}
                        onChange={(e) => patchForm(extraction.id, { reference: e.target.value })}
                        rows={2}
                      />
                    </div>
                    {form.error && <p className="text-xs text-destructive">{form.error}</p>}
                    <Button
                      size="sm"
                      onClick={() => confirm(extraction)}
                      disabled={form.isSubmitting || !form.effect.trim() || !form.management.trim() || !form.reference.trim()}
                      className="gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {form.isSubmitting ? "Sending..." : "Confirm → Pharmacist Validation"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ProtectedShell>
  );
}
