"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bell, BookOpen, Cpu, LogOut, Pill, Search, Settings, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

// Hanya berisi menu yang benar-benar punya halaman (bukan link "#" aspirational)
// — lihat SCOPE.md/README frontend untuk daftar modul yang belum ada UI-nya.
const menuItems = [
  { title: "Dashboard", icon: Activity, url: "/" },
  // M50 — jalur utama: distilasi knowledge DDI dari AI model (ingredient-first).
  { title: "Distilasi AI", icon: Sparkles, url: "/distillation" },
  // Tahap 1 (diagram workflow) — akuisisi bahan aktif ber-kode KFA.
  { title: "Bahan Aktif (KFA)", icon: Pill, url: "/ingredients" },
  { title: "Knowledge Repository", icon: BookOpen, url: "/knowledge-repository" },
  { title: "Reports", icon: BarChart3, url: "/reports" },
  { title: "Search", icon: Search, url: "/search" },
  { title: "Notification Settings", icon: Bell, url: "/settings/notifications" },
  { title: "Admin", icon: Settings, url: "/admin/users" },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_oklch(0.72_0.11_195_/_0.35)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-sm leading-none text-sidebar-foreground tracking-wide">MedKnowledge AI</span>
            <span className="text-[10px] text-primary font-medium tracking-wider uppercase">Clinical Gov</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <div className="px-2">
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    tooltip={item.title}
                    isActive={isActive}
                    className={isActive ? "font-semibold border-l-2 border-primary" : ""}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-sidebar-foreground/60"}`} />
                    <span className="text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-primary font-bold text-xs">
              {initials ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-xs leading-none text-sidebar-foreground">{user?.name ?? "..."}</span>
            <span className="text-[9px] text-sidebar-foreground/60">{user?.role?.name ?? ""}</span>
          </div>
          <button
            onClick={() => logout()}
            className="ml-auto p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
