"use client";

import { use, useEffect, useRef, useState } from "react";
import { FileUp, FlaskConical, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, ApiError } from "@/lib/api";
import type { Extraction, Paginated, Project, Source } from "@/lib/types";

function ocrBadge(status: string) {
  if (status === "done") return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">OCR Selesai</Badge>;
  if (status === "failed") return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">OCR Gagal</Badge>;
  return <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">OCR Diproses</Badge>;
}

function validationBadge(status: string) {
  if (status === "valid") return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Valid</Badge>;
  if (status === "invalid") return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">Invalid</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Menunggu Validasi</Badge>;
}

function extractionStatusBadge(status: string) {
  if (status === "passed_gate")
    return (
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> Lolos Gate
      </Badge>
    );
  if (status === "auto_rejected")
    return (
      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" /> Auto-Reject
      </Badge>
    );
  if (status === "flagged_fp_fn")
    return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Ditandai FP/FN</Badge>;
  return (
    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    try {
      const [projectData, sourcesData, extractionsData] = await Promise.all([
        apiFetch<Project>(`/projects/${id}`),
        apiFetch<Paginated<Source>>(`/projects/${id}/sources`),
        apiFetch<Paginated<Extraction>>(`/projects/${id}/extractions`),
      ]);
      setProject(projectData);
      setSources(sourcesData.data);
      setExtractions(extractionsData.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data proyek.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount/ganti id, bukan derivasi sinkron dari props
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiFetch(`/projects/${id}/sources`, { method: "POST", body: formData });
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah dokumen.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <ProtectedShell breadcrumb={project?.name ?? "Memuat..."}>
      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-400">{error}</div>
      )}

      {project && (
        <Card className="bg-slate-950/70 border-slate-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">{project.name}</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Status: <span className="text-teal-400">{project.status}</span> · Prioritas:{" "}
              <span className="capitalize">{project.priority}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 p-0.5">
          <TabsTrigger value="sources" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            Sumber Dokumen (M09)
          </TabsTrigger>
          <TabsTrigger value="extractions" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            Hasil Ekstraksi AI (M14-M21)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4 space-y-4">
          <Card className="bg-slate-950/70 border-slate-900">
            <CardHeader>
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <FileUp className="h-4 w-4 text-teal-400" /> Unggah Dokumen Sumber
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                PDF/RIS, maksimal 15MB. OCR (M10), auto-metadata (M11), dan validasi AI (M12) berjalan otomatis setelah unggah.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="file">File</Label>
                  <Input id="file" type="file" accept=".pdf,.ris" ref={fileInputRef} required />
                </div>
                <Button type="submit" disabled={isUploading} className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold">
                  {isUploading ? "Mengunggah..." : "Unggah"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-950/70 border-slate-900">
            <CardContent className="pt-6">
              <div className="border border-slate-900 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-900/50">
                    <TableRow className="border-b border-slate-900 hover:bg-transparent">
                      <TableHead className="text-xs text-slate-400">Dokumen</TableHead>
                      <TableHead className="text-xs text-slate-400">OCR</TableHead>
                      <TableHead className="text-xs text-slate-400">Validasi (M12)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map((source) => (
                      <TableRow key={source.id} className="border-b border-slate-900 hover:bg-slate-900/40">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-white">{source.title ?? source.original_filename}</span>
                            {source.rejected_reason && (
                              <span className="text-[10px] text-rose-400 mt-0.5">{source.rejected_reason}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{ocrBadge(source.ocr_status)}</TableCell>
                        <TableCell>{validationBadge(source.validation_status)}</TableCell>
                      </TableRow>
                    ))}
                    {sources.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-xs text-slate-500 py-6">
                          Belum ada dokumen sumber diunggah.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extractions" className="mt-4">
          <Card className="bg-slate-950/70 border-slate-900">
            <CardHeader>
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-indigo-400" /> Interaksi Obat Terekstrak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-slate-900 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-900/50">
                    <TableRow className="border-b border-slate-900 hover:bg-transparent">
                      <TableHead className="text-xs text-slate-400">Pasangan Obat</TableHead>
                      <TableHead className="text-xs text-slate-400">Confidence</TableHead>
                      <TableHead className="text-xs text-slate-400">Status Gate</TableHead>
                      <TableHead className="text-xs text-slate-400">Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractions.map((extraction) => (
                      <TableRow key={extraction.id} className="border-b border-slate-900 hover:bg-slate-900/40">
                        <TableCell>
                          <span className="text-xs font-medium text-white">
                            {extraction.drug_a?.canonical_name ?? extraction.raw_drug_a_text} ×{" "}
                            {extraction.drug_b?.canonical_name ?? extraction.raw_drug_b_text}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">{extraction.confidence_score ?? "-"}%</TableCell>
                        <TableCell>{extractionStatusBadge(extraction.status)}</TableCell>
                        <TableCell className="text-[10px] text-slate-500 max-w-xs">{extraction.gate_reason}</TableCell>
                      </TableRow>
                    ))}
                    {extractions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-slate-500 py-6">
                          Belum ada hasil ekstraksi. Unggah dan validasi sumber dokumen dulu.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ProtectedShell>
  );
}
