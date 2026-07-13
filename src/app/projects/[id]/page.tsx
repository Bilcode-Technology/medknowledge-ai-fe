"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileUp, FlaskConical, CheckCircle2, XCircle, Clock, AlertTriangle, Eye, FileSearch } from "lucide-react";
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
  if (status === "done") return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">OCR Selesai</Badge>;
  if (status === "failed") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">OCR Gagal</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-[10px]">OCR Diproses</Badge>;
}

function validationBadge(status: string) {
  if (status === "valid") return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Valid</Badge>;
  if (status === "invalid") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Invalid</Badge>;
  return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">Menunggu Validasi</Badge>;
}

function extractionStatusBadge(status: string) {
  if (status === "passed_gate")
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> Lolos Gate
      </Badge>
    );
  if (status === "auto_rejected")
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" /> Auto-Reject
      </Badge>
    );
  if (status === "flagged_fp_fn")
    return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">Ditandai FP/FN</Badge>;
  return (
    <Badge className="bg-muted text-muted-foreground border-border text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

const ANNOTATION_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  revision_requested: "Revisi Diminta",
  senior_review: "Senior Review",
  disputed: "Disengketakan",
  published: "Published",
};

function annotationStatusBadge(status: string) {
  if (status === "published")
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
      </Badge>
    );
  if (status === "disputed")
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] flex items-center gap-1 w-fit">
        <AlertTriangle className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
      </Badge>
    );
  if (status === "revision_requested" || status === "senior_review")
    return (
      <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] flex items-center gap-1 w-fit">
        <AlertTriangle className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
      </Badge>
    );
  return (
    <Badge className="bg-info/10 text-info border-info/20 text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
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
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>
      )}

      {project && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="text-xs">
              Status: <span className="text-primary">{project.status}</span> · Prioritas:{" "}
              <span className="capitalize">{project.priority}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="sources" className="w-full">
        <TabsList>
          <TabsTrigger value="sources" className="text-xs">
            Sumber Dokumen (M09)
          </TabsTrigger>
          <TabsTrigger value="extractions" className="text-xs">
            Hasil Ekstraksi AI (M14-M21)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileUp className="h-4 w-4 text-primary" /> Unggah Dokumen Sumber
              </CardTitle>
              <CardDescription className="text-xs">
                PDF/RIS, maksimal 15MB. OCR (M10), auto-metadata (M11), dan validasi AI (M12) berjalan otomatis setelah unggah.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="file">File</Label>
                  <Input id="file" type="file" accept=".pdf,.ris" ref={fileInputRef} required />
                </div>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? "Mengunggah..." : "Unggah"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 text-xs">Dokumen</TableHead>
                    <TableHead className="text-xs">OCR</TableHead>
                    <TableHead className="px-6 text-xs">Validasi (M12)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="px-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">{source.title ?? source.original_filename}</span>
                          {source.rejected_reason && (
                            <span className="text-[10px] text-destructive mt-0.5">{source.rejected_reason}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ocrBadge(source.ocr_status)}</TableCell>
                      <TableCell className="px-6">{validationBadge(source.validation_status)}</TableCell>
                    </TableRow>
                  ))}
                  {sources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6">
                        Belum ada dokumen sumber diunggah.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extractions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-info" /> Interaksi Obat Terekstrak
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 text-xs">Pasangan Obat</TableHead>
                    <TableHead className="text-xs">Confidence</TableHead>
                    <TableHead className="text-xs">Status Gate</TableHead>
                    <TableHead className="px-6 text-xs">Alasan</TableHead>
                    <TableHead className="px-6 text-xs text-right">Draf Annotation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractions.map((extraction) => (
                    <TableRow key={extraction.id}>
                      <TableCell className="px-6">
                        <span className="text-xs font-medium text-foreground">
                          {extraction.drug_a?.canonical_name ?? extraction.raw_drug_a_text} ×{" "}
                          {extraction.drug_b?.canonical_name ?? extraction.raw_drug_b_text}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{extraction.confidence_score ?? "-"}%</TableCell>
                      <TableCell>{extractionStatusBadge(extraction.status)}</TableCell>
                      <TableCell className="px-6 text-[10px] text-muted-foreground max-w-xs">{extraction.gate_reason}</TableCell>
                      <TableCell className="px-6 text-right">
                        {extraction.annotation ? (
                          <div className="flex items-center justify-end gap-2">
                            {annotationStatusBadge(extraction.annotation.status)}
                            <Button
                              render={<Link href={`/annotations/${extraction.annotation.id}`} />}
                              variant="ghost"
                              size="xs"
                              className="text-primary hover:text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Lihat Draf
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {extractions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                        Belum ada hasil ekstraksi. Unggah dan validasi sumber dokumen dulu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ProtectedShell>
  );
}
