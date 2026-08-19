"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Cpu,
  FlaskConical,
  LogOut,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
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

type NavItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  // Undefined = visible to every authenticated role. Admin always sees
  // everything (matches the backend: EnsureUserHasRole lets admin through
  // every `role:` gate regardless of the route's listed roles).
  roles?: string[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// Grouped by workflow (acquisition/curation, review knowledge base,
// oversight, integration, administration) rather than by raw entity name —
// and scoped per the 8 RBAC roles confirmed in the backend (RoleSeeder +
// EnsureUserHasRole route gates). Only menu items that don't yet have a
// route are omitted entirely — see SCOPE.md for the modules still pending
// frontend work.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", icon: Activity, url: "/dashboard" }],
  },
  {
    label: "Curation",
    items: [
      {
        title: "AI Distillation",
        icon: Sparkles,
        url: "/distillation",
        roles: ["project_manager", "data_acq_officer", "terminologist"],
      },
      {
        title: "Ingredients (KFA)",
        icon: Pill,
        url: "/ingredients",
        roles: ["terminologist", "data_acq_officer"],
      },
    ],
  },
  {
    label: "Knowledge base",
    items: [
      { title: "Knowledge Repository", icon: BookOpen, url: "/knowledge-repository" },
      { title: "Search", icon: Search, url: "/search" },
    ],
  },
  {
    label: "Oversight",
    items: [
      {
        title: "Reports",
        icon: BarChart3,
        url: "/reports",
        roles: ["project_manager", "senior_reviewer"],
      },
    ],
  },
  {
    label: "Integration",
    items: [
      {
        title: "FHIR Sandbox",
        icon: Stethoscope,
        url: "/admin/fhir-sandbox",
        roles: ["fhir_engineer"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Reference Data",
        icon: FlaskConical,
        url: "/admin/categories",
        roles: ["project_manager"],
      },
      { title: "Users & Roles", icon: Users, url: "/admin/users", roles: [] },
      { title: "AI Cost Monitor", icon: ShieldCheck, url: "/admin/playground", roles: [] },
    ],
  },
];

function isVisible(roles: string[] | undefined, roleCode: string | undefined) {
  if (roleCode === "admin") return true;
  if (!roles) return true;
  return roleCode != null && roles.includes(roleCode);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const roleCode = user?.role?.code;

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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_color-mix(in_oklch,var(--primary),transparent_65%)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-sm leading-none text-sidebar-foreground tracking-wide">MedKnowledge AI</span>
            <span className="text-[10px] text-primary font-medium tracking-wider uppercase">
              {user?.role?.name ?? "Clinical Gov"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => isVisible(item.roles, roleCode));
          if (items.length === 0) return null;

          return (
            <SidebarMenu key={group.label || "root"} className="px-2 pb-3">
              {group.label && (
                <p className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase group-data-[collapsible=icon]:hidden">
                  {group.label}
                </p>
              )}
              {items.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      tooltip={item.title}
                      isActive={isActive}
                      className={isActive ? "font-semibold border-l-2 border-primary" : ""}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-sidebar-foreground/60"}`} />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu className="mb-2">
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/settings/notifications" />} tooltip="Notification Settings">
              <Bell className="h-4 w-4 text-sidebar-foreground/60" />
              <span className="text-sm">Notifications</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
