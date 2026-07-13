"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ROLE_OPTIONS } from "@/lib/roles";
import type { AdminUser, Paginated } from "@/lib/types";

type CreateForm = { name: string; email: string; password: string; roleCode: string };
type EditForm = { name: string; email: string; password: string; roleCode: string; isActive: boolean };

const EMPTY_CREATE_FORM: CreateForm = { name: "", email: "", password: "", roleCode: "" };

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [usersData, setUsersData] = useState<Paginated<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  // Code -> id role yang ditemukan lewat objek `role` yang di-eager-load pada
  // setiap AdminUser (lihat catatan di lib/roles.ts — tidak ada GET /api/roles).
  const [roleIdMap, setRoleIdMap] = useState<Record<string, number>>({});

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSavingCreate, setIsSavingCreate] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function mergeRoleId(code: string | undefined, id: number | undefined) {
    if (!code || id == null) return;
    setRoleIdMap((prev) => (prev[code] === id ? prev : { ...prev, [code]: id }));
  }

  async function loadUsers(targetPage: number) {
    try {
      const data = await apiFetch<Paginated<AdminUser>>(`/users?page=${targetPage}`);
      setUsersData(data);
      data.data.forEach((row) => mergeRoleId(row.role?.code, row.role?.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat daftar pengguna.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount/ganti halaman, bukan derivasi sinkron dari props
    loadUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- role milik akun sendiri selalu jadi sumber id yang diketahui
    mergeRoleId(currentUser?.role?.code, currentUser?.role?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreateError(null);

    const roleId = roleIdMap[createForm.roleCode];
    if (!createForm.roleCode || roleId == null) {
      setCreateError(
        "ID role ini belum diketahui sistem (belum pernah dipakai pengguna manapun, dan tidak ada endpoint GET /api/roles). Pilih role lain.",
      );
      return;
    }

    setIsSavingCreate(true);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role_id: roleId,
        }),
      });
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateOpen(false);
      await loadUsers(page);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Gagal membuat pengguna.");
    } finally {
      setIsSavingCreate(false);
    }
  }

  function openEdit(row: AdminUser) {
    setEditingUser(row);
    setEditForm({
      name: row.name,
      email: row.email,
      password: "",
      roleCode: row.role?.code ?? "",
      isActive: row.is_active,
    });
    setEditError(null);
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingUser || !editForm) return;
    setEditError(null);

    const body: Record<string, unknown> = {};
    if (editForm.name !== editingUser.name) body.name = editForm.name;
    if (editForm.email !== editingUser.email) body.email = editForm.email;
    if (editForm.password) body.password = editForm.password;
    if (editForm.roleCode !== (editingUser.role?.code ?? "")) {
      const roleId = roleIdMap[editForm.roleCode];
      if (roleId == null) {
        setEditError(
          "ID role ini belum diketahui sistem (belum pernah dipakai pengguna manapun). Pilih role lain.",
        );
        return;
      }
      body.role_id = roleId;
    }
    if (editForm.isActive !== editingUser.is_active) body.is_active = editForm.isActive;

    if (Object.keys(body).length === 0) {
      setEditingUser(null);
      return;
    }

    setIsSavingEdit(true);
    try {
      await apiFetch(`/users/${editingUser.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditingUser(null);
      await loadUsers(page);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Gagal memperbarui pengguna.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeactivate(row: AdminUser) {
    if (!window.confirm(`Nonaktifkan akun "${row.name}"? Akun tidak akan bisa login lagi.`)) return;
    setError(null);
    try {
      await apiFetch(`/users/${row.id}`, { method: "DELETE" });
      await loadUsers(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menonaktifkan pengguna.");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm">Manajemen Pengguna (M49)</CardTitle>
            <CardDescription className="text-xs">
              {usersData ? `${usersData.total} pengguna terdaftar.` : "Memuat daftar pengguna..."}
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Pengguna Baru
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Tambah Pengguna</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-user-name">Nama</Label>
                    <Input
                      id="new-user-name"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-user-email">Email</Label>
                    <Input
                      id="new-user-email"
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-user-password">Password</Label>
                    <Input
                      id="new-user-password"
                      type="password"
                      required
                      minLength={8}
                      value={createForm.password}
                      onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      value={createForm.roleCode}
                      onValueChange={(value) => setCreateForm((f) => ({ ...f, roleCode: value as string }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role.code} value={role.code}>
                            {role.label}
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
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground">
                    {row.name}
                    {row.id === currentUser?.id && (
                      <Badge className="ml-2 bg-muted text-muted-foreground border-border text-[10px]">Anda</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.email}</TableCell>
                  <TableCell>
                    <Badge className="bg-info/10 text-info border-info/20 text-[10px]">
                      {row.role?.name ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.is_active ? (
                      <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Aktif</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-border text-[10px]">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {row.is_active && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeactivate(row)}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {usersData && usersData.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                    Tidak ada pengguna.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {usersData && usersData.last_page > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Halaman {usersData.current_page} dari {usersData.last_page}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page >= usersData.last_page}
                  onClick={() => setPage((p) => Math.min(usersData.last_page, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editingUser != null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent>
          {editingUser && editForm && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Pengguna — {editingUser.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-user-name">Nama</Label>
                  <Input
                    id="edit-user-name"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-user-email">Email</Label>
                  <Input
                    id="edit-user-email"
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => (f ? { ...f, email: e.target.value } : f))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-user-password">Password Baru (opsional)</Label>
                  <Input
                    id="edit-user-password"
                    type="password"
                    minLength={8}
                    placeholder="Biarkan kosong bila tidak diubah"
                    value={editForm.password}
                    onChange={(e) => setEditForm((f) => (f ? { ...f, password: e.target.value } : f))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={editForm.roleCode}
                    onValueChange={(value) =>
                      setEditForm((f) => (f ? { ...f, roleCode: value as string } : f))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.code} value={role.code}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Label className="flex items-center gap-2 font-normal text-xs">
                  <Checkbox
                    checked={editForm.isActive}
                    onCheckedChange={(checked) =>
                      setEditForm((f) => (f ? { ...f, isActive: checked === true } : f))
                    }
                  />
                  <span>Akun aktif</span>
                </Label>
                {editingUser.id === currentUser?.id && (
                  <p className="text-[11px] text-muted-foreground">
                    Anda tidak bisa menonaktifkan akun sendiri atau mengubah role akun sendiri — backend akan
                    menolak perubahan tersebut.
                  </p>
                )}
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
    </div>
  );
}
