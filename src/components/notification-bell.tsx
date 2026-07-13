"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { NotificationItem, Paginated } from "@/lib/types";

// M46 UI — bell notifikasi in-app di header. Tidak ada primitive
// popover/dropdown-menu di src/components/ui, jadi dropdown ini dibangun
// manual (div absolut + click-outside-to-close) sesuai arahan agar tidak
// menambah dependency baru.
export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      const data = await apiFetch<Paginated<NotificationItem>>("/notifications");
      setNotifications(data.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat notifikasi.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data saat mount, bukan derivasi sinkron dari props
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    setError(null);
    setMarkingId(id);
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      await loadNotifications();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menandai notifikasi.");
    } finally {
      setMarkingId(null);
    }
  }

  const unreadCount = notifications.filter((notification) => notification.read_at === null).length;
  const recent = notifications.slice(0, 10);

  return (
    <div className="relative ml-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifikasi"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="text-[10px] text-muted-foreground">{unreadCount} belum dibaca</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {error && <p className="px-3 py-2 text-[10px] text-destructive">{error}</p>}
            {recent.length === 0 && !error && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Tidak ada notifikasi.</p>
            )}
            {recent.map((notification) => {
              const isUnread = notification.read_at === null;
              return (
                <button
                  key={notification.id}
                  type="button"
                  disabled={markingId === notification.id}
                  onClick={() => (isUnread ? markAsRead(notification.id) : undefined)}
                  className={`flex w-full flex-col gap-0.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted disabled:opacity-60 ${
                    isUnread ? "bg-primary/5" : ""
                  }`}
                >
                  <span className={`text-xs ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {isUnread && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />}
                    {notification.data.message}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
