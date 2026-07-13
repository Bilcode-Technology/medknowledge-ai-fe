"use client";

import * as React from "react";
import {
  Activity,
  Folder,
  FileText,
  Cpu,
  BookOpen,
  CheckSquare,
  Database,
  ShieldCheck,
  Settings,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  {
    title: "Dashboard",
    icon: Activity,
    url: "#",
    isActive: true,
  },
  {
    title: "Projects",
    icon: Folder,
    url: "#",
    items: [
      { title: "List View", url: "#" },
      { title: "Kanban Board", url: "#" },
      { title: "Timeline / SLA", url: "#" },
    ],
  },
  {
    title: "Sources",
    icon: FileText,
    url: "#",
    items: [
      { title: "Upload Center", url: "#" },
      { title: "Metadata Validation", url: "#" },
    ],
  },
  {
    title: "AI Evidence Lab",
    icon: Cpu,
    url: "#",
    items: [
      { title: "Extraction Queue", url: "#" },
      { title: "Terminology Coding", url: "#" },
    ],
  },
  {
    title: "Verification Queue",
    icon: CheckSquare,
    url: "#",
    items: [
      { title: "Pharmacist Review", url: "#" },
      { title: "Senior Arbitration", url: "#" },
    ],
  },
  {
    title: "FHIR Publisher",
    icon: Database,
    url: "#",
    items: [
      { title: "FHIR Resources", url: "#" },
      { title: "Validator Sandbox", url: "#" },
    ],
  },
  {
    title: "Compliance & Audit",
    icon: ShieldCheck,
    url: "#",
    items: [
      { title: "Immutable Audit Log", url: "#" },
      { title: "Version Control", url: "#" },
    ],
  },
  {
    title: "Administration",
    icon: Settings,
    url: "#",
    items: [
      { title: "RBAC Matrix", url: "#" },
      { title: "AI Prompt Config", url: "#" },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="border-slate-800 bg-slate-950 text-slate-200" {...props}>
      <SidebarHeader className="border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.5)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-sm leading-none text-white tracking-wide">MedKnowledge AI</span>
            <span className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">Clinical Gov</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.items ? (
                <div className="px-2">
                  <SidebarMenuButton tooltip={item.title} className="hover:bg-slate-900 hover:text-white">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-sm text-slate-300">{item.title}</span>
                    <ChevronRight className="ml-auto h-3 w-3 text-slate-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                  <SidebarMenuSub className="border-l border-slate-800 ml-5 pl-2 mt-1">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton href={subItem.url} className="hover:text-teal-400 text-slate-400 text-xs">
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </div>
              ) : (
                <div className="px-2">
                  <SidebarMenuButton 
                    tooltip={item.title} 
                    className={`hover:bg-slate-900 hover:text-white ${
                      item.isActive ? "bg-slate-900! text-teal-400 font-semibold border-l-2 border-teal-500" : ""
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${item.isActive ? "text-teal-400" : "text-slate-400"}`} />
                    <span className="text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </div>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-slate-700">
            <AvatarImage src="" />
            <AvatarFallback className="bg-slate-800 text-teal-400 font-bold text-xs">Ph.D</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="font-semibold text-xs leading-none text-white">Dr. Sarah Connor</span>
            <span className="text-[9px] text-slate-400">Pharmacist Reviewer</span>
          </div>
          <button className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
