"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock, Cpu, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import type { AiDraftAccuracy, AverageVerificationTime, ReviewerThroughput } from "@/lib/types";

// Warna literal (bukan class Tailwind) diambil dari palet .dark di globals.css —
// Recharts merender SVG dan tidak membaca custom property lewat class, jadi
// nilai oklch() dari tema dark disalin persis di sini supaya chart menyatu
// dengan tema, bukan terlihat seperti komponen asing yang ditempel.
const CHART_COLORS = {
  bar: "oklch(0.72 0.11 195)", // --primary (dark)
  grid: "oklch(1 0 0 / 8%)", // --border (dark)
  axisText: "oklch(0.68 0.02 235)", // --muted-foreground (dark)
  tooltipBg: "oklch(0.21 0.018 240)", // --card (dark)
  tooltipBorder: "oklch(1 0 0 / 8%)", // --border (dark)
  tooltipText: "oklch(0.94 0.006 235)", // --foreground (dark)
};

export default function ReportsPage() {
  const [verificationTime, setVerificationTime] = useState<AverageVerificationTime | null>(null);
  const [accuracy, setAccuracy] = useState<AiDraftAccuracy | null>(null);
  const [throughput, setThroughput] = useState<ReviewerThroughput[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadThroughput() {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const query = params.toString();
      const data = await apiFetch<ReviewerThroughput[]>(
        `/reports/reviewer-throughput${query ? `?${query}` : ""}`,
      );
      setThroughput(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat throughput reviewer.");
    }
  }

  async function loadData() {
    try {
      const [accuracyData, verificationData, throughputData] = await Promise.all([
        apiFetch<AiDraftAccuracy>("/reports/ai-draft-accuracy"),
        apiFetch<AverageVerificationTime>("/reports/average-verification-time"),
        apiFetch<ReviewerThroughput[]>("/reports/reviewer-throughput"),
      ]);
      setAccuracy(accuracyData);
      setVerificationTime(verificationData);
      setThroughput(throughputData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat data laporan.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount, bukan derivasi sinkron dari props
    loadData();
  }, []);

  useEffect(() => {
    if (!fromDate && !toDate) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-fetch saat filter tanggal berubah
    loadThroughput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const totalReviews = throughput.reduce((sum, row) => sum + row.review_count, 0);
  const chartData = throughput.map((row) => ({
    name: row.reviewer.name,
    review_count: row.review_count,
  }));

  return (
    <ProtectedShell breadcrumb="Reports & Analytics">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rata-rata Waktu Verifikasi</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {verificationTime?.average_hours != null ? `${verificationTime.average_hours} jam` : "-"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {verificationTime ? `${verificationTime.sample_size} sampel` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akurasi Draf AI</CardTitle>
            <Cpu className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {accuracy?.accuracy_rate_percent != null ? `${accuracy.accuracy_rate_percent}%` : "-"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {accuracy ? `${accuracy.approved_first_pass}/${accuracy.total_pharmacist_reviews} disetujui first-pass` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Review Reviewer</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalReviews}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {throughput.length} reviewer aktif pada rentang ini
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Throughput Reviewer
          </CardTitle>
          <CardDescription className="text-xs">Jumlah review yang diselesaikan per reviewer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="from-date">Dari Tanggal</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to-date">Sampai Tanggal</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Tidak ada data throughput reviewer pada rentang ini.
            </p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                    tickLine={{ stroke: CHART_COLORS.grid }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                    tickLine={{ stroke: CHART_COLORS.grid }}
                  />
                  <Tooltip
                    cursor={{ fill: CHART_COLORS.grid }}
                    contentStyle={{
                      backgroundColor: CHART_COLORS.tooltipBg,
                      border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: CHART_COLORS.tooltipText,
                    }}
                    labelStyle={{ color: CHART_COLORS.tooltipText }}
                  />
                  <Bar dataKey="review_count" name="Jumlah Review" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
