"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth-context";

// Dipakai di setiap halaman dashboard — redirect ke /login bila belum
// terautentikasi (pengecekan client-side, karena token disimpan di
// localStorage, bukan cookie yang bisa dibaca server-side).
export function ProtectedShell({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb: string;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Memuat...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-y-auto bg-slate-950 border-slate-900">
          <header className="flex h-16 items-center gap-4 border-b border-slate-900 px-6 sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
            <SidebarTrigger className="text-slate-400 hover:text-white" />
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span>Clinical Governance</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-200 font-medium">{breadcrumb}</span>
            </div>
          </header>
          <main className="flex-1 p-6 space-y-6 max-w-7xl">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
