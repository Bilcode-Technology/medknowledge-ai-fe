"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch, ApiError } from "@/lib/api";
import type { ReferenceStandard } from "@/lib/types";

type StandardForm = {
  name: string;
  version: string;
  sourceUrl: string;
  description: string;
  publishedAt: string;
};

const EMPTY_FORM: StandardForm = { name: "", version: "", sourceUrl: "", description: "", publishedAt: "" };

function toBody(form: StandardForm) {
  return {
    name: form.name,
    version: form.version,
    source_url: form.sourceUrl || null,
    description: form.description || null,
    published_at: form.publishedAt || null,
  };
}

export default function AdminReferenceStandardsPage() {
  const [standards, setStandards] = useState<ReferenceStandard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StandardForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSavingCreate, setIsSavingCreate] = useState(false);

  const [editing, setEditing] = useState<ReferenceStandard | null>(null);
  const [editForm, setEditForm] = useState<StandardForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function loadStandards() {
    try {
      const data = await apiFetch<ReferenceStandard[]>("/reference-standards");
      setStandards(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat reference standards.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount, bukan derivasi sinkron dari props
    loadStandards();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreateError(null);
    setIsSavingCreate(true);
    try {
      await apiFetch("/reference-standards", { method: "POST", body: JSON.stringify(toBody(createForm)) });
      setCreateForm(EMPTY_FORM);
      setCreateOpen(false);
      await loadStandards();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Gagal membuat reference standard.");
    } finally {
      setIsSavingCreate(false);
    }
  }

  function openEdit(standard: ReferenceStandard) {
    setEditing(standard);
    setEditForm({
      name: standard.name,
      version: standard.version,
      sourceUrl: standard.source_url ?? "",
      description: standard.description ?? "",
      publishedAt: standard.published_at ? standard.published_at.slice(0, 10) : "",
    });
    setEditError(null);
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setEditError(null);
    setIsSavingEdit(true);
    try {
      await apiFetch(`/reference-standards/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(toBody(editForm)),
      });
      setEditing(null);
      await loadStandards();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Gagal memperbarui reference standard.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(standard: ReferenceStandard) {
    if (!window.confirm(`Hapus reference standard "${standard.name} (${standard.version})"?`)) return;
    setError(null);
    try {
      await apiFetch(`/reference-standards/${standard.id}`, { method: "DELETE" });
      await loadStandards();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus reference standard.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm">Reference Standards (M08)</CardTitle>
          <CardDescription className="text-xs">{standards.length} standar referensi terdaftar.</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Standard Baru
              </Button>
            }
          />
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Tambah Reference Standard</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rs-create-name">Nama</Label>
                    <Input
                      id="rs-create-name"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rs-create-version">Versi</Label>
                    <Input
                      id="rs-create-version"
                      required
                      value={createForm.version}
                      onChange={(e) => setCreateForm((f) => ({ ...f, version: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rs-create-url">Source URL (opsional)</Label>
                  <Input
                    id="rs-create-url"
                    type="url"
                    value={createForm.sourceUrl}
                    onChange={(e) => setCreateForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rs-create-published">Tanggal Publikasi (opsional)</Label>
                  <Input
                    id="rs-create-published"
                    type="date"
                    value={createForm.publishedAt}
                    onChange={(e) => setCreateForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rs-create-description">Deskripsi (opsional)</Label>
                  <Textarea
                    id="rs-create-description"
                    rows={3}
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                {createError && <p className="text-xs text-destructive">{createError}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSavingCreate}>
                  {isSavingCreate ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Versi</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Publikasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standards.map((standard) => (
              <TableRow key={standard.id}>
                <TableCell className="font-medium text-foreground">{standard.name}</TableCell>
                <TableCell className="text-muted-foreground">{standard.version}</TableCell>
                <TableCell className="text-muted-foreground">
                  {standard.source_url ? (
                    <a
                      href={standard.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Tautan
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {standard.published_at ? standard.published_at.slice(0, 10) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(standard)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(standard)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {standards.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                  Belum ada reference standard.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog
        open={editing != null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          {editing && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Reference Standard — {editing.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rs-edit-name">Nama</Label>
                    <Input
                      id="rs-edit-name"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rs-edit-version">Versi</Label>
                    <Input
                      id="rs-edit-version"
                      required
                      value={editForm.version}
                      onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rs-edit-url">Source URL (opsional)</Label>
                  <Input
                    id="rs-edit-url"
                    type="url"
                    value={editForm.sourceUrl}
                    onChange={(e) => setEditForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rs-edit-published">Tanggal Publikasi (opsional)</Label>
                  <Input
                    id="rs-edit-published"
                    type="date"
                    value={editForm.publishedAt}
                    onChange={(e) => setEditForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rs-edit-description">Deskripsi (opsional)</Label>
                  <Textarea
                    id="rs-edit-description"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                {editError && <p className="text-xs text-destructive">{editError}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSavingEdit}>
                  {isSavingEdit ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
