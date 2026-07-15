"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, Sparkles, Eye, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KfaIngredientPicker } from "@/components/kfa-ingredient-picker";
import { apiFetch, ApiError } from "@/lib/api";
import type { DistillationRun, Paginated, PlaygroundModel, Project } from "@/lib/types";

// M50 — AI Knowledge Distillation (ingredient-first): pilih zat aktif ber-KFA →
// prompt AI → kartu 5-field → konfirmasi → jalur validasi apoteker (M29-M32).
// Ini jalur UTAMA; upload dokumen kini referensi opsional (simpan-saja).

function runStatusBadge(status: string) {
  if (status === "completed")
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  if (status === "running")
    return (
      <Badge className="bg-info/10 text-info border-info/20 text-[10px] flex items-center gap-1 w-fit">
        <Loader2 className="h-3 w-3 animate-spin" /> Running
      </Badge>
    );
  return (
    <Badge className="bg-muted text-muted-foreground border-border text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> Queued
    </Badge>
  );
}

// useSearchParams() wajib berada di bawah <Suspense> saat prerender build —
// karena itu isi halaman dipisah ke komponen sendiri (lihat default export bawah).
function DistillationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [runs, setRuns] = useState<DistillationRun[]>([]);
  const [models, setModels] = useState<PlaygroundModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // M50 — hanya interactant1 yang ditentukan manusia; interactant2 SELALU
  // didistilasi AI (sebanyak yang diketahui model), bukan input user — lihat
  // catatan Pak Amin: "interactant keduanya jangan kita tentukan".
  const [ingredient, setIngredient] = useState({ name: "", kfa: null as string | null });
  const [model, setModel] = useState("gpt-4o");
  const [promptOverride, setPromptOverride] = useState(searchParams.get("prompt") ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount
    apiFetch<Paginated<Project>>("/projects")
      .then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) setProjectId(String(res.data[0].id));
      })
      .catch(() => setError("Failed to load project list."));
    apiFetch<{ data: PlaygroundModel[] }>("/ai-playground/models")
      .then((res) => setModels(res.data ?? []))
      .catch(() => setModels([])); // non-admin tidak bisa list model — pakai default
  }, []);

  useEffect(() => {
    if (!projectId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch runs saat proyek berganti
    apiFetch<Paginated<DistillationRun>>(`/projects/${projectId}/distillations`)
      .then((res) => setRuns(res.data))
      .catch(() => setRuns([]));
  }, [projectId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!projectId || !ingredient.name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const run = await apiFetch<DistillationRun>(`/projects/${projectId}/distillations`, {
        method: "POST",
        body: JSON.stringify({
          ingredient_name: ingredient.name,
          ingredient_kfa_code: ingredient.kfa,
          model,
          prompt_override: promptOverride.trim() || null,
        }),
      });
      router.push(`/distillation/${run.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start distillation.");
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedShell breadcrumb="AI Distillation">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Knowledge Distillation (M50)
            </CardTitle>
            <CardDescription className="text-xs">
              Pick a single active ingredient (KFA code) — the AI distills all interaction pairs it knows on its own,
              then the result becomes 5-field cards (interactant, effect, management, reference) to confirm for pharmacist validation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={(value) => setProjectId((value as string) ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>AI Model</Label>
                  <Select value={model} onValueChange={(value) => setModel((value as string) ?? "gpt-4o")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(models.length > 0 ? models.map((m) => m.id) : ["gpt-4o", "gpt-4o-mini"]).map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <KfaIngredientPicker
                    label="Active ingredient *"
                    name={ingredient.name}
                    kfaCode={ingredient.kfa}
                    onChange={(name, kfa) => setIngredient({ name, kfa })}
                    placeholder="e.g. paracetamol"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    The interacting counterpart (interactant 2) does not need to be entered — the AI will distill all
                    substances known to interact with this ingredient on its own.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prompt-override">Custom prompt (optional — leave blank for the standard template)</Label>
                <Textarea
                  id="prompt-override"
                  value={promptOverride}
                  onChange={(e) => setPromptOverride(e.target.value)}
                  placeholder="Leave blank to use the standard distillation prompt template."
                  rows={3}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={isSubmitting || !projectId || !ingredient.name.trim()} className="gap-2">
                <FlaskConical className="h-4 w-4" />
                {isSubmitting ? "Starting..." : "Run Distillation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distillation History</CardTitle>
            <CardDescription className="text-xs">Distillation runs for the selected project.</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No distillation runs for this project yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Active Ingredient</TableHead>
                    <TableHead>Counterpart</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-xs font-medium">{run.ingredient_name}</TableCell>
                      <TableCell className="text-xs">{run.counterpart_name ?? "all"}</TableCell>
                      <TableCell className="text-xs font-mono">{run.model}</TableCell>
                      <TableCell>{runStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-xs">{run.user?.name ?? "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" render={<Link href={`/distillation/${run.id}`} />} className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedShell>
  );
}

export default function DistillationPage() {
  return (
    <Suspense>
      <DistillationPageContent />
    </Suspense>
  );
}
