"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, DollarSign, Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { CostSummaryRow, PlaygroundChatResponse, PlaygroundModel } from "@/lib/types";

function formatCost(cost: string | null): string {
  if (cost == null) return "-";
  const value = Number(cost);
  return Number.isFinite(value) ? `$${value.toFixed(4)}` : cost;
}

export default function AdminPlaygroundPage() {
  const [models, setModels] = useState<PlaygroundModel[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummaryRow[]>([]);
  const [history, setHistory] = useState<PlaygroundChatResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function loadModels() {
    try {
      const data = await apiFetch<{ data: PlaygroundModel[]; object: string }>("/ai-playground/models");
      setModels(data.data);
      if (data.data.length > 0) {
        setModel((current) => current || data.data[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load AI model list.");
    }
  }

  async function loadCostSummary() {
    try {
      const data = await apiFetch<CostSummaryRow[]>("/ai-playground/cost-summary");
      setCostSummary(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load cost summary.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount, bukan derivasi sinkron dari props
    loadModels();
    loadCostSummary();
  }, []);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || !model) return;
    setError(null);
    setIsSending(true);
    try {
      const response = await apiFetch<PlaygroundChatResponse>("/ai-playground/chat", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          model,
          ...(systemPrompt.trim() ? { system_prompt: systemPrompt } : {}),
        }),
      });
      setHistory((prev) => [response, ...prev]);
      await loadCostSummary();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to call AI Playground.");
    } finally {
      setIsSending(false);
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
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> AI Playground (M48)
          </CardTitle>
          <CardDescription className="text-xs">
            Test prompts directly against AI models configured via LiteLLM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Select value={model} onValueChange={(value) => setModel(value as string)}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playground-system-prompt">System Prompt (optional)</Label>
              <Textarea
                id="playground-system-prompt"
                rows={2}
                placeholder="e.g. You are a clinical pharmacology assistant."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="playground-prompt">Prompt</Label>
              <Textarea
                id="playground-prompt"
                rows={4}
                required
                placeholder="Write a prompt for the AI model..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Every submission calls a real AI model and incurs real token cost.
              </p>
              <div className="flex gap-2 shrink-0">
                {/* M50 — "Mulai dari AI Playground": lanjutkan prompt ini ke pipeline distilasi. */}
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/distillation${prompt.trim() ? `?prompt=${encodeURIComponent(prompt)}` : ""}`} />}
                  className="gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Start distillation from this prompt
                </Button>
                <Button type="submit" size="sm" disabled={isSending || !model} className="gap-1">
                  <Send className="h-3.5 w-3.5" /> {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Response History</CardTitle>
          <CardDescription className="text-xs">Most recent results shown first.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {history.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="bg-info/10 text-info border-info/20 text-[10px]">{item.model}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {item.total_tokens != null ? `${item.total_tokens} token` : "- token"} ·{" "}
                    {formatCost(item.cost_usd)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{item.prompt}</p>
                <p className="text-xs text-foreground whitespace-pre-wrap">{item.response_content}</p>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No conversations yet. Send a prompt above to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" /> Cost Summary per Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Call Count</TableHead>
                <TableHead>Total Tokens</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costSummary.map((row) => (
                <TableRow key={row.model}>
                  <TableCell className="font-medium text-foreground">{row.model}</TableCell>
                  <TableCell className="text-muted-foreground">{row.call_count}</TableCell>
                  <TableCell className="text-muted-foreground">{row.total_tokens ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCost(row.total_cost_usd)}</TableCell>
                </TableRow>
              ))}
              {costSummary.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                    No cost data yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
