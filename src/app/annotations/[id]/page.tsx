"use client";

import { use, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileClock,
  FileText,
  GitCompareArrows,
  History,
  MessageSquare,
  Pencil,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { AnnotationEditor } from "@/components/annotation-editor";
import { VersionDiffView } from "@/components/version-diff-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useAuth } from "@/lib/auth-context";
import {
  Annotation,
  ArbitrationDiff,
  CHECKLIST_LABELS,
  MANAGEMENT_CATEGORY_LABELS,
  REQUIRED_CHECKLIST_KEYS,
} from "@/lib/types";

const ANNOTATION_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  revision_requested: "Revisi Diminta",
  senior_review: "Senior Review",
  disputed: "Disengketakan",
  published: "Published",
};

function annotationStatusBadge(status: string) {
  if (status === "published") {
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
      </Badge>
    );
  }
  if (status === "disputed") {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] flex items-center gap-1 w-fit">
        <AlertTriangle className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
      </Badge>
    );
  }
  if (status === "revision_requested" || status === "senior_review") {
    return (
      <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] flex items-center gap-1 w-fit">
        <AlertTriangle className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
      </Badge>
    );
  }
  return (
    <Badge className="bg-info/10 text-info border-info/20 text-[10px] flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> {ANNOTATION_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

const DECISION_LABEL: Record<string, string> = {
  approved: "Disetujui",
  revision_requested: "Revisi Diminta",
  rejected: "Ditolak",
  disputed: "Disengketakan",
};

function decisionBadge(decision: string) {
  if (decision === "approved") {
    return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{DECISION_LABEL[decision]}</Badge>;
  }
  if (decision === "rejected" || decision === "disputed") {
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">{DECISION_LABEL[decision]}</Badge>;
  }
  return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">{DECISION_LABEL[decision] ?? decision}</Badge>;
}

function pendingRoleNote(status: string): string | null {
  switch (status) {
    case "draft":
      return "Menunggu tindakan dari Pharmacist.";
    case "senior_review":
      return "Menunggu tindakan dari Senior Reviewer.";
    case "disputed":
      return "Menunggu tindakan dari Arbiter.";
    case "revision_requested":
      return "Menunggu revisi dari penulis draf.";
    default:
      return null;
  }
}

function emptyChecklist(): Record<string, boolean> {
  return Object.fromEntries(REQUIRED_CHECKLIST_KEYS.map((key) => [key, false]));
}

// GET /annotations/{id} hanya eager-load relasi "versions" (bukan "versions.changedBy"),
// jadi field changed_by yang benar-benar dikirim backend adalah id user mentah (angka)
// atau null — bukan objek {id, name} seperti tipe Annotation di lib/types.ts. Tangani
// kedua bentuk secara defensif supaya tidak salah menampilkan "AI" untuk versi yang
// sebenarnya diedit manusia.
function versionAuthorLabel(changedBy: unknown): string {
  if (!changedBy) return "AI";
  if (typeof changedBy === "object" && "name" in (changedBy as Record<string, unknown>)) {
    return String((changedBy as { name: unknown }).name);
  }
  return `Pengguna #${changedBy}`;
}

export default function AnnotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [arbitration, setArbitration] = useState<ArbitrationDiff | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mode edit konten (M27)
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Aksi review (M29 Pharmacist / Senior Reviewer / M32 Arbiter)
  const [checklist, setChecklist] = useState<Record<string, boolean>>(emptyChecklist());
  const [notes, setNotes] = useState("");
  const [sourceInvalid, setSourceInvalid] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [isDisputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeContent, setDisputeContent] = useState("");
  const [disputeNotes, setDisputeNotes] = useState("");

  const [resolution, setResolution] = useState<"original" | "proposed" | null>(null);
  const [arbiterNotes, setArbiterNotes] = useState("");

  // Riwayat versi
  const [rollingVersionId, setRollingVersionId] = useState<number | null>(null);

  // M28 "Track Changes" — diff word-level antar dua versi (bukan live
  // collaborative editing, lihat catatan di kartu Riwayat Versi & VersionDiffView).
  const [compareFromVersionNumber, setCompareFromVersionNumber] = useState<string | null>(null);
  const [compareToVersionNumber, setCompareToVersionNumber] = useState<string | null>(null);
  const [isDiffDialogOpen, setDiffDialogOpen] = useState(false);

  // Komentar (M28)
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [resolvingCommentId, setResolvingCommentId] = useState<number | null>(null);

  async function loadData() {
    try {
      const data = await apiFetch<Annotation>(`/annotations/${id}`);
      setAnnotation(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data annotation.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount/ganti id, bukan derivasi sinkron dari props
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isArbiterTurn = user?.role?.code === "arbiter" && annotation?.status === "disputed";

  useEffect(() => {
    if (!isArbiterTurn) {
      return;
    }
    apiFetch<ArbitrationDiff>(`/annotations/${id}/arbitration`)
      .then(setArbitration)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat data arbitrase."));
  }, [isArbiterTurn, id]);

  if (!annotation) {
    return (
      <ProtectedShell breadcrumb="Memuat...">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>
        )}
      </ProtectedShell>
    );
  }

  const drugALabel = annotation.extraction.drug_a?.canonical_name ?? annotation.extraction.raw_drug_a_text;
  const drugBLabel = annotation.extraction.drug_b?.canonical_name ?? annotation.extraction.raw_drug_b_text;
  const drugPairLabel = `${drugALabel} × ${drugBLabel}`;

  const canEditContent = annotation.status === "draft" || annotation.status === "revision_requested";
  const isPharmacistTurn = user?.role?.code === "pharmacist" && annotation.status === "draft";
  const isSeniorTurn = user?.role?.code === "senior_reviewer" && annotation.status === "senior_review";
  const noActionForUser = !isPharmacistTurn && !isSeniorTurn && !isArbiterTurn;
  const note = pendingRoleNote(annotation.status);

  // M28 — setiap update()/rollback() backend (AnnotationController) selalu membuat
  // AnnotationVersion baru DAN menyamakan current_version_number ke versi itu, jadi
  // annotation.content selalu identik dengan content_snapshot versi current_version_number.
  // contentForVersionNumber tetap fallback ke annotation.content untuk versi current
  // seandainya baris versi itu tidak ikut ter-load, tapi ini harusnya tidak pernah terjadi.
  const sortedVersions = [...(annotation.versions ?? [])].sort((a, b) => b.version_number - a.version_number);

  function contentForVersionNumber(versionNumber: number): string {
    const found = sortedVersions.find((v) => v.version_number === versionNumber);
    if (found) return found.content_snapshot;
    if (versionNumber === annotation!.current_version_number) return annotation!.content;
    return "";
  }

  const canCompareVersions =
    compareFromVersionNumber !== null &&
    compareToVersionNumber !== null &&
    compareFromVersionNumber !== compareToVersionNumber;

  function startEditing() {
    setDraftContent(annotation!.content);
    setChangeSummary("");
    setIsEditingContent(true);
  }

  function cancelEditing() {
    setIsEditingContent(false);
    setDraftContent("");
    setChangeSummary("");
  }

  async function saveContent() {
    setError(null);
    setIsSavingContent(true);
    try {
      await apiFetch(`/annotations/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          content: sanitizeHtml(draftContent),
          change_summary: changeSummary || undefined,
        }),
      });
      setIsEditingContent(false);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan konten.");
    } finally {
      setIsSavingContent(false);
    }
  }

  async function submitReview(payload: Record<string, unknown>): Promise<boolean> {
    setError(null);
    setIsSubmittingAction(true);
    try {
      await apiFetch(`/annotations/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await loadData();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim keputusan review.");
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleApprove() {
    const ok = await submitReview({
      decision: "approved",
      checklist_results: checklist,
      notes: notes || undefined,
    });
    if (ok) {
      setNotes("");
      setChecklist(emptyChecklist());
    }
  }

  async function handleRequestRevision() {
    const ok = await submitReview({ decision: "revision_requested", notes: notes || undefined });
    if (ok) setNotes("");
  }

  async function handleReject() {
    const ok = await submitReview({
      decision: "rejected",
      notes: notes || undefined,
      ...(sourceInvalid ? { source_invalid: true } : {}),
    });
    if (ok) {
      setNotes("");
      setSourceInvalid(false);
    }
  }

  async function handleSeniorApprove() {
    await submitReview({ decision: "approved" });
  }

  async function handleSeniorRevision() {
    const ok = await submitReview({ decision: "revision_requested", notes: notes || undefined });
    if (ok) setNotes("");
  }

  async function handleDisputeSubmit() {
    const ok = await submitReview({
      decision: "disputed",
      proposed_content: sanitizeHtml(disputeContent),
      notes: disputeNotes || undefined,
    });
    if (ok) {
      setDisputeDialogOpen(false);
      setDisputeContent("");
      setDisputeNotes("");
    }
  }

  async function handleArbiterResolve() {
    if (!resolution) return;
    const ok = await submitReview({ decision: "approved", resolution, notes: arbiterNotes || undefined });
    if (ok) {
      setArbiterNotes("");
      setResolution(null);
    }
  }

  async function handleRollback(versionId: number) {
    setError(null);
    setRollingVersionId(versionId);
    try {
      await apiFetch(`/annotations/${id}/versions/${versionId}/rollback`, { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal melakukan rollback.");
    } finally {
      setRollingVersionId(null);
    }
  }

  async function handleAddComment() {
    if (!newCommentText.trim()) return;
    setError(null);
    setIsSubmittingComment(true);
    try {
      await apiFetch(`/annotations/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newCommentText }),
      });
      setNewCommentText("");
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah komentar.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleReplySubmit(parentId: number) {
    if (!replyText.trim()) return;
    setError(null);
    setIsSubmittingReply(true);
    try {
      await apiFetch(`/annotations/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: replyText, parent_comment_id: parentId }),
      });
      setReplyText("");
      setReplyOpenId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membalas komentar.");
    } finally {
      setIsSubmittingReply(false);
    }
  }

  async function handleResolveComment(commentId: number) {
    setError(null);
    setResolvingCommentId(commentId);
    try {
      await apiFetch(`/comments/${commentId}/resolve`, { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyelesaikan komentar.");
    } finally {
      setResolvingCommentId(null);
    }
  }

  return (
    <ProtectedShell breadcrumb={`Draf Annotation — ${drugPairLabel}`}>
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>
      )}

      {/* 1. Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardDescription className="text-xs">{annotation.project?.name ?? "-"}</CardDescription>
              <CardTitle className="text-lg">{drugPairLabel}</CardTitle>
            </div>
            {annotationStatusBadge(annotation.status)}
          </div>
        </CardHeader>
      </Card>

      {/* 1b. M50 — provenans distilasi AI: annotation ini TIDAK berasal dari dokumen
          (tidak ada PDF/sitasi halaman), melainkan dari knowledge AI model yang
          sudah dikonfirmasi manusia. Reviewer memverifikasi 5 field + referensi. */}
      {annotation.extraction.origin === "ai_distillation" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Sumber: Distilasi AI (M50)
            </CardTitle>
            <CardDescription className="text-xs">
              Interaksi ini didistilasi dari AI model (run #{annotation.extraction.distillation_run_id ?? "-"}), bukan
              diekstrak dari dokumen — verifikasi kebenaran klinis & referensi di bawah, bukan sitasi halaman PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="grid gap-2 md:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Interactant 1:</span>{" "}
                <span className="font-medium">{annotation.extraction.raw_drug_a_text}</span>
                {annotation.extraction.kfa_code_a && (
                  <Badge className="ml-2 bg-success/10 text-success border-success/20 text-[10px] font-mono">
                    KFA {annotation.extraction.kfa_code_a}
                  </Badge>
                )}
              </p>
              <p>
                <span className="text-muted-foreground">Interactant 2:</span>{" "}
                <span className="font-medium">{annotation.extraction.raw_drug_b_text}</span>
                {annotation.extraction.kfa_code_b && (
                  <Badge className="ml-2 bg-success/10 text-success border-success/20 text-[10px] font-mono">
                    KFA {annotation.extraction.kfa_code_b}
                  </Badge>
                )}
              </p>
            </div>
            {annotation.extraction.effect && (
              <p>
                <span className="text-muted-foreground">Effect:</span> {annotation.extraction.effect}
              </p>
            )}
            {annotation.extraction.management && (
              <p>
                <span className="text-muted-foreground">Management:</span> {annotation.extraction.management}
                {annotation.extraction.management_category && (
                  <Badge className="ml-2 bg-warning/10 text-warning border-warning/20 text-[10px]">
                    {MANAGEMENT_CATEGORY_LABELS[annotation.extraction.management_category] ??
                      annotation.extraction.management_category}
                  </Badge>
                )}
              </p>
            )}
            {annotation.extraction.reference_text && (
              <p>
                <span className="text-muted-foreground">Reference (atribusi AI — wajib diverifikasi):</span>{" "}
                {annotation.extraction.reference_text}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. Konten */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Konten Annotation
              </CardTitle>
              <CardDescription className="text-xs">Versi saat ini: v{annotation.current_version_number}</CardDescription>
            </div>
            {!isEditingContent && canEditContent && (
              <Button size="sm" variant="outline" onClick={startEditing} className="gap-1">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnnotationEditor
            content={isEditingContent ? draftContent : annotation.content}
            editable={isEditingContent}
            onChange={setDraftContent}
          />
          {isEditingContent && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="change-summary">Ringkasan Perubahan (opsional)</Label>
                <Input
                  id="change-summary"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="mis. Perbaikan sitasi & severity"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveContent} disabled={isSavingContent} className="gap-1">
                  <Save className="h-3.5 w-3.5" /> {isSavingContent ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing} disabled={isSavingContent}>
                  Batal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Aksi role & status */}
      {isPharmacistTurn && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Verifikasi Pharmacist (M29)
            </CardTitle>
            <CardDescription className="text-xs">Semua poin wajib dicentang sebelum draf dapat disetujui.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              {REQUIRED_CHECKLIST_KEYS.map((key) => (
                <Label key={key} className="flex items-start gap-2 font-normal text-xs">
                  <Checkbox
                    checked={checklist[key]}
                    onCheckedChange={(checked) => setChecklist((prev) => ({ ...prev, [key]: checked === true }))}
                  />
                  <span>{CHECKLIST_LABELS[key]}</span>
                </Label>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pharmacist-notes">Catatan (opsional)</Label>
              <Textarea
                id="pharmacist-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan verifikasi..."
              />
            </div>
            <Label className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 font-normal text-xs">
              <Checkbox checked={sourceInvalid} onCheckedChange={(checked) => setSourceInvalid(checked === true)} />
              <span>
                Sumber dokumen itu sendiri tidak valid — dokumen sumber bermasalah, bukan hanya draf yang perlu direvisi.
                Hanya relevan bila digunakan bersama Reject.
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isSubmittingAction || !REQUIRED_CHECKLIST_KEYS.every((key) => checklist[key])}
                className="gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={handleRequestRevision} disabled={isSubmittingAction}>
                Request Revision
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={isSubmittingAction} className="gap-1">
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isSeniorTurn && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Review Senior Reviewer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senior-notes">Catatan (opsional, dipakai untuk Request Revision)</Label>
              <Textarea id="senior-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSeniorApprove} disabled={isSubmittingAction} className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Publish
              </Button>
              <Button size="sm" variant="outline" onClick={handleSeniorRevision} disabled={isSubmittingAction}>
                Request Revision
              </Button>
              <Dialog
                open={isDisputeDialogOpen}
                onOpenChange={(open) => {
                  setDisputeDialogOpen(open);
                  if (open) setDisputeContent(annotation.content);
                }}
              >
                <DialogTrigger
                  render={
                    <Button size="sm" variant="destructive" className="gap-1">
                      <Scale className="h-3.5 w-3.5" /> Dispute
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajukan Sengketa (M32)</DialogTitle>
                    <DialogDescription>
                      Usulkan versi konten alternatif. Arbiter akan memilih antara draf asli (disetujui pharmacist) atau
                      usulan Anda.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label>Konten Usulan</Label>
                      <AnnotationEditor content={disputeContent} editable onChange={setDisputeContent} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dispute-notes">Catatan Sengketa</Label>
                      <Textarea
                        id="dispute-notes"
                        value={disputeNotes}
                        onChange={(e) => setDisputeNotes(e.target.value)}
                        placeholder="Alasan sengketa..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button size="sm" onClick={handleDisputeSubmit} disabled={isSubmittingAction || !disputeContent.trim()}>
                      {isSubmittingAction ? "Mengirim..." : "Kirim Sengketa"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {isArbiterTurn && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> Arbitrase (M32)
            </CardTitle>
            <CardDescription className="text-xs">Pilih versi konten yang akan dipublikasikan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!arbitration && <p className="text-xs text-muted-foreground">Memuat data arbitrase...</p>}
            {arbitration && (
              <>
                {arbitration.dispute_notes && (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                    <span className="font-medium">Catatan Sengketa: </span>
                    {arbitration.dispute_notes}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Original (Pharmacist-approved)</Label>
                    <AnnotationEditor content={arbitration.original_content} editable={false} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex-col items-start gap-0.5">
                      <span>Proposed (Senior Reviewer)</span>
                      {arbitration.proposed_by && (
                        <span className="text-[10px] font-normal text-muted-foreground">oleh {arbitration.proposed_by.name}</span>
                      )}
                    </Label>
                    {arbitration.proposed_content ? (
                      <AnnotationEditor content={arbitration.proposed_content} editable={false} />
                    ) : (
                      <p className="text-xs text-muted-foreground">Tidak ada usulan konten.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Keputusan</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={resolution === "original" ? "default" : "outline"}
                      onClick={() => setResolution("original")}
                    >
                      Keep Original
                    </Button>
                    <Button
                      size="sm"
                      variant={resolution === "proposed" ? "default" : "outline"}
                      onClick={() => setResolution("proposed")}
                      disabled={!arbitration.proposed_content}
                    >
                      Use Proposed
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="arbiter-notes">Catatan (opsional)</Label>
                  <Textarea id="arbiter-notes" value={arbiterNotes} onChange={(e) => setArbiterNotes(e.target.value)} />
                </div>
                <Button size="sm" onClick={handleArbiterResolve} disabled={isSubmittingAction || !resolution} className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Selesaikan Sengketa
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {noActionForUser && note && (
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{note}</p>
          </CardContent>
        </Card>
      )}

      {/* 4. Riwayat Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-info" /> Riwayat Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(annotation.reviews ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">Belum ada review.</p>
          )}
          {(annotation.reviews ?? []).map((review) => (
            <div key={review.id} className="rounded-lg border border-border p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">
                  {review.reviewer.name} <span className="font-normal text-muted-foreground">({review.review_role})</span>
                </span>
                {decisionBadge(review.decision)}
              </div>
              <p className="text-[10px] text-muted-foreground">{new Date(review.decided_at).toLocaleString()}</p>
              {review.notes && <p className="text-xs">{review.notes}</p>}
              {review.checklist_results && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(review.checklist_results).map(([key, value]) => (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 text-[10px] ${value ? "text-success" : "text-destructive"}`}
                    >
                      {value ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {CHECKLIST_LABELS[key as keyof typeof CHECKLIST_LABELS] ?? key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 5. Riwayat Versi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileClock className="h-4 w-4 text-info" /> Riwayat Versi
          </CardTitle>
          <CardDescription className="text-xs">
            Implementasi M28 &quot;Track Changes&quot;: diff kata-per-kata antar dua versi, bukan live collaborative editing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedVersions.length >= 2 && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Bandingkan versi</Label>
                <Select value={compareFromVersionNumber ?? undefined} onValueChange={setCompareFromVersionNumber}>
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue placeholder="Versi lama" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedVersions.map((version) => (
                      <SelectItem key={version.id} value={String(version.version_number)}>
                        v{version.version_number}
                        {version.version_number === annotation.current_version_number ? " (saat ini)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">dengan</Label>
                <Select value={compareToVersionNumber ?? undefined} onValueChange={setCompareToVersionNumber}>
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue placeholder="Versi baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedVersions.map((version) => (
                      <SelectItem key={version.id} value={String(version.version_number)}>
                        v{version.version_number}
                        {version.version_number === annotation.current_version_number ? " (saat ini)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={!canCompareVersions}
                onClick={() => setDiffDialogOpen(true)}
              >
                <GitCompareArrows className="h-3.5 w-3.5" /> Bandingkan
              </Button>
            </div>
          )}
          {sortedVersions.map((version) => (
            <div key={version.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium">
                  v{version.version_number} — {versionAuthorLabel(version.changed_by)}
                </span>
                {version.change_summary && <p className="text-[10px] text-muted-foreground">{version.change_summary}</p>}
                <p className="text-[10px] text-muted-foreground">{new Date(version.created_at).toLocaleString()}</p>
              </div>
              {version.version_number !== annotation.current_version_number && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 shrink-0"
                  disabled={rollingVersionId === version.id}
                  onClick={() => handleRollback(version.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {rollingVersionId === version.id ? "Rollback..." : "Rollback ke versi ini"}
                </Button>
              )}
            </div>
          ))}
          {sortedVersions.length === 0 && <p className="text-xs text-muted-foreground">Belum ada riwayat versi.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDiffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Perbandingan v{compareFromVersionNumber} → v{compareToVersionNumber}
            </DialogTitle>
            <DialogDescription>
              Teks yang dicoret merah dihapus, teks bergaris bawah hijau ditambahkan.
            </DialogDescription>
          </DialogHeader>
          {canCompareVersions && (
            <VersionDiffView
              oldContent={contentForVersionNumber(Number(compareFromVersionNumber))}
              newContent={contentForVersionNumber(Number(compareToVersionNumber))}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Komentar (M28) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-info" /> Komentar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(annotation.comments ?? []).map((comment) => (
              <div key={comment.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{comment.user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs">{comment.content}</p>
                <div className="flex items-center gap-2">
                  {comment.resolved ? (
                    <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Resolved</Badge>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setReplyOpenId(replyOpenId === comment.id ? null : comment.id);
                          setReplyText("");
                        }}
                      >
                        Balas
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={resolvingCommentId === comment.id}
                        onClick={() => handleResolveComment(comment.id)}
                      >
                        {resolvingCommentId === comment.id ? "Menyelesaikan..." : "Resolve"}
                      </Button>
                    </>
                  )}
                </div>
                {replyOpenId === comment.id && (
                  <div className="space-y-1.5 pt-1">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tulis balasan..."
                    />
                    <div className="flex gap-2">
                      <Button size="xs" onClick={() => handleReplySubmit(comment.id)} disabled={isSubmittingReply}>
                        {isSubmittingReply ? "Mengirim..." : "Kirim"}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setReplyOpenId(null);
                          setReplyText("");
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
                {comment.replies.length > 0 && (
                  <div className="ml-4 space-y-2 border-l border-border pl-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">{reply.user.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(annotation.comments ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada komentar.</p>
            )}
          </div>
          <div className="space-y-1.5 border-t border-border pt-3">
            <Label htmlFor="new-comment">Tambah Komentar</Label>
            <Textarea
              id="new-comment"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Tulis komentar..."
            />
            <Button size="sm" onClick={handleAddComment} disabled={isSubmittingComment || !newCommentText.trim()}>
              {isSubmittingComment ? "Mengirim..." : "Kirim Komentar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
