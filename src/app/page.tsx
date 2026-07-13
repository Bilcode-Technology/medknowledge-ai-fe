"use client";

import React, { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Search, 
  Database, 
  ArrowUpRight, 
  FileText, 
  Cpu, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  ShieldAlert,
  SearchCode,
  Folder
} from "lucide-react";

// Mock data representing the active projects in the workflow
const mockProjects = [
  {
    id: "PRJ-2026-01",
    name: "Anticoagulant Drug Interaction Update",
    disease: "Atrial Fibrillation",
    drugCategory: "Anticoagulants / Antiarrhythmics",
    status: "Verification",
    priority: "Major",
    reviewer: "Dr. Sarah Connor",
    deadline: "2026-07-20",
    version: "v2.1"
  },
  {
    id: "PRJ-2026-02",
    name: "Pediatric Antibiotic Dosing Guidelines",
    disease: "Respiratory Infections",
    drugCategory: "Antibiotics / Penicillins",
    status: "AI Extraction",
    priority: "Moderate",
    reviewer: "AI Operator Leo",
    deadline: "2026-07-25",
    version: "v1.0"
  },
  {
    id: "PRJ-2026-03",
    name: "Chemotherapy Contraindications Update",
    disease: "Oncology",
    drugCategory: "Antineoplastics",
    status: "Senior Review",
    priority: "Contraindicated",
    reviewer: "Prof. Dian Wijaya",
    deadline: "2026-07-18",
    version: "v4.2"
  },
  {
    id: "PRJ-2026-04",
    name: "Hypertension Combination Risk Profile",
    disease: "Hypertension",
    drugCategory: "ACE Inhibitors / ARBs",
    status: "Published",
    priority: "Minor",
    reviewer: "Dr. Sarah Connor",
    deadline: "2026-07-10",
    version: "v3.0"
  }
];

// Mock data for FHIR resource validation & sync logs
const mockFhirSyncLogs = [
  { resource: "ClinicalUseDefinition", id: "cud-war-ami-01", status: "Synced", time: "3 mins ago" },
  { resource: "MedicationKnowledge", id: "medk-warf-20", status: "Synced", time: "10 mins ago" },
  { resource: "ClinicalUseDefinition", id: "cud-keta-prop-02", status: "Failed", time: "25 mins ago" },
  { resource: "DetectedIssue", id: "issue-drug-int-554", status: "Synced", time: "1 hour ago" },
  { resource: "PlanDefinition", id: "plan-afib-support", status: "Synced", time: "3 hours ago" }
];

// Mock data for the Immutable Audit Trail
const mockAuditTrail = [
  { user: "Sarah Connor (Pharmacist)", action: "Approved evidence mapping for Warfarin + Amiodarone", project: "PRJ-2026-01", ip: "192.168.12.87", time: "2026-07-13 14:32:10" },
  { user: "AI Engine", action: "Extracted 4 potential interactions from PubMed-3847289", project: "PRJ-2026-02", ip: "10.0.4.15", time: "2026-07-13 13:05:44" },
  { user: "Leo Malik (AI Operator)", action: "Initialized Project and uploaded guideline 'AFIB-2026-rev.pdf'", project: "PRJ-2026-02", ip: "192.168.12.92", time: "2026-07-13 11:22:15" },
  { user: "Prof. Dian Wijaya (Senior Reviewer)", action: "Rejected initial pharmacist draft for Project Chemotherapy", project: "PRJ-2026-03", ip: "192.168.10.4", time: "2026-07-13 09:15:30" }
];

export default function DashboardHome() {
  const [activeTab, setActiveTab] = useState("all-projects");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Filter projects based on search query
  const filteredProjects = mockProjects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.drugCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
        {/* Navigation Sidebar */}
        <AppSidebar />
        
        {/* Main Content Area */}
        <SidebarInset className="flex flex-col flex-1 overflow-y-auto bg-slate-950 border-slate-900">
          
          {/* Dashboard Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-900 px-6 sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-400 hover:text-white" />
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <span>Clinical Governance</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
                <span className="text-slate-200 font-medium">Dashboard Overview</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search drugs, guidelines, KFA..." 
                  className="pl-9 h-9 w-full bg-slate-900 border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-teal-500/50 focus-visible:border-teal-500/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* FHIR Status badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wide">
                <Database className="h-3 w-3" />
                <span>FHIR Server: Connected</span>
              </div>
              
              <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 ring-2 ring-slate-950 animate-ping" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6 max-w-7xl">
            {/* Platform Banner Notification */}
            <Alert className="bg-slate-900/60 border-slate-800/80 text-slate-300">
              <ShieldAlert className="h-4 w-4 text-teal-400" />
              <AlertTitle className="text-white font-medium">Enterprise Health Governance</AlertTitle>
              <AlertDescription className="text-xs text-slate-400">
                You are currently logged in with **Pharmacist Reviewer** privileges. All modifications are logged in real-time to the immutable audit database and synced to HL7 FHIR servers.
              </AlertDescription>
            </Alert>

            {/* KPI Cards Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              
              {/* Card 1 */}
              <Card className="bg-slate-950/70 border-slate-900 hover:border-slate-800 transition-all hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Projects</CardTitle>
                  <Folder className="h-4 w-4 text-teal-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">28</div>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3" /> +12% increase from last week
                  </p>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="bg-slate-950/70 border-slate-900 hover:border-slate-800 transition-all hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Journals</CardTitle>
                  <FileText className="h-4 w-4 text-sky-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">142</div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Checked from PubMed / CrossRef
                  </p>
                </CardContent>
              </Card>

              {/* Card 3 */}
              <Card className="bg-slate-950/70 border-slate-900 hover:border-slate-800 transition-all hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Accuracy Rate</CardTitle>
                  <Cpu className="h-4 w-4 text-indigo-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">94.2%</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full" style={{ width: "94.2%" }} />
                  </div>
                </CardContent>
              </Card>

              {/* Card 4 */}
              <Card className="bg-slate-950/70 border-slate-900 hover:border-slate-800 transition-all hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FHIR Synced Data</CardTitle>
                  <Database className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">87 <span className="text-xs text-slate-500 font-normal">items</span></div>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3 w-3" /> 100% sync status health
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Projects List & Tabs (Left 2 Columns) */}
              <div className="md:col-span-2 space-y-6">
                <Card className="bg-slate-950/70 border-slate-900 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base font-semibold text-white">Clinical Knowledge Pipeline</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Track and manage medical guidelines as they transit through the AI and verification engine.</CardDescription>
                    </div>
                    <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold h-8 text-xs gap-1 shadow-[0_0_10px_rgba(20,184,166,0.3)]">
                      <Folder className="h-3.5 w-3.5" /> New Project
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <div className="flex justify-between items-center mb-4">
                        <TabsList className="bg-slate-900 border border-slate-800 p-0.5">
                          <TabsTrigger value="all-projects" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">Active Queue</TabsTrigger>
                          <TabsTrigger value="verification" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">Review Needed</TabsTrigger>
                          <TabsTrigger value="published" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">Published (FHIR)</TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="all-projects" className="mt-0">
                        <div className="border border-slate-900 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-slate-900/50">
                              <TableRow className="border-b border-slate-900 hover:bg-transparent">
                                <TableHead className="text-xs text-slate-400 font-semibold w-[100px]">ID</TableHead>
                                <TableHead className="text-xs text-slate-400 font-semibold">Project Name</TableHead>
                                <TableHead className="text-xs text-slate-400 font-semibold">Priority</TableHead>
                                <TableHead className="text-xs text-slate-400 font-semibold">Status</TableHead>
                                <TableHead className="text-xs text-slate-400 font-semibold text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProjects.map((project) => (
                                <TableRow key={project.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                                  <TableCell className="font-mono text-[11px] text-slate-400">{project.id}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-xs text-white">{project.name}</span>
                                      <span className="text-[10px] text-slate-500 mt-0.5">{project.drugCategory}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-xs text-teal-400 hover:text-white hover:bg-slate-800"
                                      onClick={() => setSelectedProject(project)}
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>

                      <TabsContent value="verification" className="mt-0">
                        <div className="border border-slate-900 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-slate-900/50">
                              <TableRow className="border-b border-slate-900">
                                <TableHead className="text-xs text-slate-400">ID</TableHead>
                                <TableHead className="text-xs text-slate-400">Project Name</TableHead>
                                <TableHead className="text-xs text-slate-400">Priority</TableHead>
                                <TableHead className="text-xs text-slate-400">Reviewer</TableHead>
                                <TableHead className="text-xs text-slate-400 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProjects.filter(p => p.status === "Verification" || p.status === "Senior Review").map((project) => (
                                <TableRow key={project.id} className="border-b border-slate-900 hover:bg-slate-900/40">
                                  <TableCell className="font-mono text-xs text-slate-400">{project.id}</TableCell>
                                  <TableCell className="text-xs font-semibold text-white">{project.name}</TableCell>
                                  <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                                  <TableCell className="text-xs text-slate-300">{project.reviewer}</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-400 hover:text-white" onClick={() => setSelectedProject(project)}>
                                      Review
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>

                      <TabsContent value="published" className="mt-0">
                        <div className="border border-slate-900 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-slate-900/50">
                              <TableRow className="border-b border-slate-900">
                                <TableHead className="text-xs text-slate-400">ID</TableHead>
                                <TableHead className="text-xs text-slate-400">Project Name</TableHead>
                                <TableHead className="text-xs text-slate-400">Version</TableHead>
                                <TableHead className="text-xs text-slate-400">Released</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProjects.filter(p => p.status === "Published").map((project) => (
                                <TableRow key={project.id} className="border-b border-slate-900 hover:bg-slate-900/40">
                                  <TableCell className="font-mono text-xs text-slate-400">{project.id}</TableCell>
                                  <TableCell className="text-xs font-semibold text-white">{project.name}</TableCell>
                                  <TableCell>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{project.version}</Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-400">Released to FHIR</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Audit Trail Timeline */}
                <Card className="bg-slate-950/70 border-slate-900 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Immutable Audit Trail Feed</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Cryptographically chained logs recording all modifications to the clinical guidelines.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockAuditTrail.map((log, index) => (
                      <div key={index} className="flex gap-4 p-3 rounded-lg bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-teal-400">
                          <ShieldCheckIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200">{log.user}</span>
                            <span className="text-[10px] text-slate-500">{log.time}</span>
                          </div>
                          <p className="text-xs text-slate-400">{log.action}</p>
                          <div className="flex gap-2 items-center text-[10px]">
                            <span className="text-teal-400 bg-teal-500/5 px-1.5 py-0.5 rounded border border-teal-500/10 font-mono">{log.project}</span>
                            <span className="text-slate-500 font-mono">IP: {log.ip}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Side Panels (Right Column) */}
              <div className="space-y-6">
                
                {/* Selected Project Quick-Inspect details */}
                {selectedProject && (
                  <Card className="bg-slate-900 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.05)]">
                    <CardHeader className="pb-3 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-slate-800 text-slate-200 border-slate-700">{selectedProject.id}</Badge>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-white" onClick={() => setSelectedProject(null)}>Close</Button>
                      </div>
                      <CardTitle className="text-sm font-semibold text-white mt-2">{selectedProject.name}</CardTitle>
                      <CardDescription className="text-[11px] text-slate-400">Owner: {selectedProject.reviewer}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Target Disease</span>
                        <span className="text-slate-200 font-medium">{selectedProject.disease}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Drug Classification</span>
                        <span className="text-slate-200 font-medium">{selectedProject.drugCategory}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Priority</span>
                          <span>{getPriorityBadge(selectedProject.priority)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pipeline Step</span>
                          <span>{getStatusBadge(selectedProject.status)}</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-800 pt-3 flex gap-2">
                        <Button size="sm" className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs h-8">
                          Launch Editor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Confidence Monitor widget */}
                <Card className="bg-slate-950/70 border-slate-900 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-indigo-400" /> AI Confidence Monitor
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-400">Verifying AI extraction validation thresholds.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Confidence Threshold</span>
                        <span className="text-indigo-400 font-bold font-mono">80.0%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full" style={{ width: "80%" }} />
                      </div>
                      <span className="text-[10px] text-slate-500 block">Values below this limit are automatically flagged for physical pharmacist validation.</span>
                    </div>

                    <div className="border-t border-slate-900 pt-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> Waiting AI Process</span>
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold">9 Papers</Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Alert Level (Major)</span>
                        <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold">4 Flagged</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FHIR Sync Queue panel */}
                <Card className="bg-slate-950/70 border-slate-900 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-sm font-semibold text-white">FHIR Integration Logs</CardTitle>
                      <CardDescription className="text-[11px] text-slate-400">Real-time HL7 FHIR sync activity</CardDescription>
                    </div>
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500 animate-spin" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockFhirSyncLogs.map((log, index) => (
                      <div key={index} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900/30 border border-slate-900">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-300">{log.resource}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{log.time}</span>
                          {log.status === "Synced" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0">Synced</Badge>
                          ) : (
                            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px] px-1 py-0">Failed</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// Helper icons mapping
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Helpers for badges styling
function getPriorityBadge(priority: string) {
  switch (priority) {
    case "Contraindicated":
      return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Contraindicated</Badge>;
    case "Major":
      return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]">Major</Badge>;
    case "Moderate":
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Moderate</Badge>;
    default:
      return <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">Minor</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Published":
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Published</Badge>;
    case "Verification":
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] flex items-center gap-1 w-fit"><UserCheck className="h-3 w-3" /> Pharmacist Review</Badge>;
    case "Senior Review":
      return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3" /> Senior Review</Badge>;
    default:
      return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] flex items-center gap-1 w-fit"><Cpu className="h-3 w-3" /> AI Extraction</Badge>;
  }
}
