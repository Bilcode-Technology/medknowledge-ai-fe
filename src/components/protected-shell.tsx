"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
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
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-y-auto bg-background">
          <header className="flex h-16 items-center gap-4 border-b border-border px-6 sticky top-0 bg-background/80 backdrop-blur-md z-40">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-px bg-border" />
            <div className="flex flex-1 items-center gap-1.5 text-sm text-muted-foreground">
              <span>Clinical Governance</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-foreground font-medium">{breadcrumb}</span>
            </div>
            <NotificationBell />
          </header>
          <main className="flex-1 p-6 space-y-6 max-w-7xl">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
