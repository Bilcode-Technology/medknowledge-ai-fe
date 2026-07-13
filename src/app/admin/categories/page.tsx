"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";

type CategoryForm = { name: string; parentId: string };

const EMPTY_FORM: CategoryForm = { name: "", parentId: "" };

function CategorySection({
  resourcePath,
  title,
}: {
  resourcePath: "disease-categories" | "drug-categories";
  title: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSavingCreate, setIsSavingCreate] = useState(false);

  const [editing, setEditing] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function loadCategories() {
    try {
      const data = await apiFetch<Category[]>(`/${resourcePath}`);
      setCategories(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Gagal memuat ${title.toLowerCase()}.`);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount, bukan derivasi sinkron dari props
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function categoryName(id: number | null): string {
    if (id == null) return "-";
    return categories.find((c) => c.id === id)?.name ?? `#${id}`;
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreateError(null);
    setIsSavingCreate(true);
    try {
      await apiFetch(`/${resourcePath}`, {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name,
          parent_id: createForm.parentId ? Number(createForm.parentId) : null,
        }),
      });
      setCreateForm(EMPTY_FORM);
      setCreateOpen(false);
      await loadCategories();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Gagal membuat kategori.");
    } finally {
      setIsSavingCreate(false);
    }
  }

  function openEdit(category: Category) {
    setEditing(category);
    setEditForm({ name: category.name, parentId: category.parent_id ? String(category.parent_id) : "" });
    setEditError(null);
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setEditError(null);
    setIsSavingEdit(true);
    try {
      await apiFetch(`/${resourcePath}/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          parent_id: editForm.parentId ? Number(editForm.parentId) : null,
        }),
      });
      setEditing(null);
      await loadCategories();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Gagal memperbarui kategori.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Hapus kategori "${category.name}"? Tindakan ini permanen dan tidak bisa dibatalkan.`))
      return;
    setError(null);
    try {
      await apiFetch(`/${resourcePath}/${category.id}`, { method: "DELETE" });
      await loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus kategori.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription className="text-xs">{categories.length} kategori terdaftar.</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Kategori Baru
              </Button>
            }
          />
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Tambah {title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`${resourcePath}-create-name`}>Nama</Label>
                  <Input
                    id={`${resourcePath}-create-name`}
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Induk (opsional)</Label>
                  <Select
                    value={createForm.parentId}
                    onValueChange={(value) => setCreateForm((f) => ({ ...f, parentId: value as string }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tanpa induk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tanpa induk (root)</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <TableHead>Induk</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">{categoryName(category.parent_id)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(category)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">
                  Belum ada kategori.
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
                <DialogTitle>Edit Kategori — {editing.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`${resourcePath}-edit-name`}>Nama</Label>
                  <Input
                    id={`${resourcePath}-edit-name`}
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Induk (opsional)</Label>
                  <Select
                    value={editForm.parentId}
                    onValueChange={(value) => setEditForm((f) => ({ ...f, parentId: value as string }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tanpa induk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tanpa induk (root)</SelectItem>
                      {categories
                        .filter((cat) => cat.id !== editing.id)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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

export default function AdminCategoriesPage() {
  return (
    <Tabs defaultValue="disease">
      <TabsList>
        <TabsTrigger value="disease">Kategori Penyakit</TabsTrigger>
        <TabsTrigger value="drug">Kategori Obat</TabsTrigger>
      </TabsList>
      <TabsContent value="disease" className="pt-4">
        <CategorySection resourcePath="disease-categories" title="Kategori Penyakit" />
      </TabsContent>
      <TabsContent value="drug" className="pt-4">
        <CategorySection resourcePath="drug-categories" title="Kategori Obat" />
      </TabsContent>
    </Tabs>
  );
}
