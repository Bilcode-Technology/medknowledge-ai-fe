"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { ProtectedShell } from "@/components/protected-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";
import type { NotificationPreferences } from "@/lib/types";

type Channel = keyof NotificationPreferences;

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingChannel, setSavingChannel] = useState<Channel | null>(null);

  async function loadPreferences() {
    try {
      const data = await apiFetch<NotificationPreferences>("/notification-preferences");
      setPreferences(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notification preferences.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount, bukan derivasi sinkron dari props
    loadPreferences();
  }, []);

  async function handleToggle(channel: Channel, checked: boolean) {
    setError(null);
    setSavingChannel(channel);
    const previous = preferences;
    setPreferences((prev) => (prev ? { ...prev, [channel]: checked } : prev));
    try {
      const updated = await apiFetch<NotificationPreferences>("/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify({ [channel]: checked }),
      });
      setPreferences(updated);
    } catch (err) {
      setPreferences(previous ?? null);
      setError(err instanceof ApiError ? err.message : "Failed to save notification preferences.");
    } finally {
      setSavingChannel(null);
    }
  }

  return (
    <ProtectedShell breadcrumb="Notification Settings">
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notification Preferences
          </CardTitle>
          <CardDescription className="text-xs">
            Configure notification delivery channels. In-app (bell) notifications are always on and cannot be disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!preferences && !error ? (
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : (
            <>
              <Label className="flex items-center gap-2 font-normal text-xs">
                <Checkbox
                  checked={preferences?.email ?? false}
                  disabled={!preferences || savingChannel === "email"}
                  onCheckedChange={(checked) => handleToggle("email", checked === true)}
                />
                <span>Email</span>
              </Label>
              <Label className="flex items-center gap-2 font-normal text-xs">
                <Checkbox
                  checked={preferences?.whatsapp ?? false}
                  disabled={!preferences || savingChannel === "whatsapp"}
                  onCheckedChange={(checked) => handleToggle("whatsapp", checked === true)}
                />
                <span>WhatsApp</span>
              </Label>
            </>
          )}
        </CardContent>
      </Card>
    </ProtectedShell>
  );
}
