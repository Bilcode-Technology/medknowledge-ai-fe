"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

// M49 — Panel administrasi (5 halaman: Pengguna, Kategori, Reference Standards,
// AI Playground, FHIR Sandbox). Layout ini satu-satunya tempat yang melakukan
// role-gate untuk seluruh section /admin/* (bukan diulang di tiap page.tsx) —
// lihat catatan tiap item di ADMIN_NAV untuk role mana saja yang boleh mengakses
// tiap sub-halaman: Pengguna & AI Playground murni role:admin di backend, FHIR
// Sandbox admin+fhir_engineer (cocok dengan role:admin,fhir_engineer di backend
// POST /fhir/validate), sedangkan Kategori & Reference Standards mengizinkan
// admin+project_manager (read sebenarnya terbuka untuk semua user terautentikasi
// di backend, tapi UI ini sengaja dibatasi hanya untuk admin/project_manager
// karena section /admin memang area utilitas admin).
type AdminNavItem = {
  title: string;
  href: string;
  breadcrumb: string;
  roles: string[];
};

const ADMIN_NAV: AdminNavItem[] = [
  { title: "Pengguna", href: "/admin/users", breadcrumb: "Manajemen Pengguna", roles: ["admin"] },
  {
    // Tahap 0 — Penetapan Standar: severity schema, evidence grading, template
    // anotasi (jawaban "Tahap 0 ada dimana?" — sebelumnya API-only, tanpa UI).
    title: "Standar (Tahap 0)",
    href: "/admin/standards",
    breadcrumb: "Tahap 0 — Penetapan Standar",
    roles: ["admin", "project_manager"],
  },
  {
    title: "Kategori",
    href: "/admin/categories",
    breadcrumb: "Kategori Penyakit & Obat",
    roles: ["admin", "project_manager"],
  },
  {
    title: "Reference Standards",
    href: "/admin/reference-standards",
    breadcrumb: "Reference Standards",
    roles: ["admin", "project_manager"],
  },
  {
    title: "AI Playground",
    href: "/admin/playground",
    breadcrumb: "AI Playground & Cost Monitor",
    roles: ["admin"],
  },
  {
    title: "FHIR Sandbox",
    href: "/admin/fhir-sandbox",
    breadcrumb: "FHIR Validator & Sandbox",
    roles: ["admin", "fhir_engineer"],
  },
];

const ROLE_NAME: Record<string, string> = {
  admin: "Administrator",
  project_manager: "Project Manager",
  fhir_engineer: "FHIR Engineer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const current =
    ADMIN_NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? ADMIN_NAV[0];
  const roleCode = user?.role?.code ?? "";
  const isAuthorized = current.roles.includes(roleCode);

  return (
    <ProtectedShell breadcrumb={current.breadcrumb}>
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {ADMIN_NAV.map((item) => (
          <Button
            key={item.href}
            render={<Link href={item.href} />}
            variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
            size="sm"
          >
            {item.title}
          </Button>
        ))}
      </div>

      {isAuthorized ? (
        children
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-10 text-center text-sm text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <p>
            Akses ditolak. Halaman ini khusus untuk{" "}
            {current.roles.map((code) => ROLE_NAME[code] ?? code).join(" atau ")}.
          </p>
        </div>
      )}
    </ProtectedShell>
  );
}
