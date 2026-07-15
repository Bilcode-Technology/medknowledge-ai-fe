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
        <CheckCircle2 className="h-3 w-3" /> Selesai
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" /> Gagal
      </Badge>
    );
  if (status === "running")
    return (
      <Badge className="bg-info/10 text-info border-info/20 text-[10px] flex items-center gap-1 w-fit">
        <Loader2 className="h-3 w-3 animate-spin" /> Berjalan
      </Badge>
    );
  return (
    <Badge className="bg-muted text-muted-foreground border-border text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> Antre
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

  const [ingredient, setIngredient] = useState({ name: "", kfa: null as string | null });
  const [counterpart, setCounterpart] = useState({ name: "", kfa: null as string | null });
  const [model, setModel] = useState("gpt-4o");
  const [promptOverride, setPromptOverride] = useState(searchParams.get("prompt") ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount
    apiFetch<Paginated<Project>>("/projects")
      .then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) setProjectId(String(res.data[0].id));
      })
      .catch(() => setError("Gagal memuat daftar proyek."));
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
          counterpart_name: counterpart.name.trim() || null,
          counterpart_kfa_code: counterpart.kfa,
          model,
          prompt_override: promptOverride.trim() || null,
        }),
      });
      router.push(`/distillation/${run.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memulai distilasi.");
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedShell breadcrumb="Distilasi AI">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Distilasi Knowledge AI (M50)
            </CardTitle>
            <CardDescription className="text-xs">
              Distilasikan pengetahuan drug-drug interaction langsung dari AI model — pilih zat aktif (kode KFA), jalankan
              prompt, lalu konfirmasi hasil 5-field (interactant, effect, management, reference) ke validasi apoteker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Proyek</Label>
                  <Select value={projectId} onValueChange={(value) => setProjectId((value as string) ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih proyek" />
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
                  <Label>Model AI</Label>
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
                <KfaIngredientPicker
                  label="Zat aktif (interactant 1) *"
                  name={ingredient.name}
                  kfaCode={ingredient.kfa}
                  onChange={(name, kfa) => setIngredient({ name, kfa })}
                  placeholder="mis. paracetamol"
                />
                <KfaIngredientPicker
                  label="Lawan interaksi (interactant 2, opsional — kosongkan untuk semua interaksi)"
                  name={counterpart.name}
                  kfaCode={counterpart.kfa}
                  onChange={(name, kfa) => setCounterpart({ name, kfa })}
                  placeholder="mis. warfarin"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prompt-override">Prompt kustom (opsional — kosongkan untuk template standar)</Label>
                <Textarea
                  id="prompt-override"
                  value={promptOverride}
                  onChange={(e) => setPromptOverride(e.target.value)}
                  placeholder="Biarkan kosong untuk memakai template prompt distilasi standar."
                  rows={3}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={isSubmitting || !projectId || !ingredient.name.trim()} className="gap-2">
                <FlaskConical className="h-4 w-4" />
                {isSubmitting ? "Memulai..." : "Jalankan Distilasi"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Riwayat Distilasi</CardTitle>
            <CardDescription className="text-xs">Run distilasi pada proyek terpilih.</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada run distilasi untuk proyek ini.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zat Aktif</TableHead>
                    <TableHead>Lawan</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Oleh</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-xs font-medium">{run.ingredient_name}</TableCell>
                      <TableCell className="text-xs">{run.counterpart_name ?? "semua"}</TableCell>
                      <TableCell className="text-xs font-mono">{run.model}</TableCell>
                      <TableCell>{runStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-xs">{run.user?.name ?? "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" render={<Link href={`/distillation/${run.id}`} />} className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> Lihat
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
