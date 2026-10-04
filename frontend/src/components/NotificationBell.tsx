"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AppNotification,
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    timeAgo,
} from "@/lib/api/social";

const ICONS: Record<AppNotification["type"], string> = { MATCH: "🎉", MESSAGE: "💬", UPDATE: "📢" };

/** Bell with unread badge + dropdown. `unread` is polled by the layout. */
export function NotificationBell({ unread, onChange, align = "left" }: { unread: number; onChange: () => void; align?: "left" | "right" }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<AppNotification[] | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        try {
            setItems((await listNotifications()).items);
        } catch {
            setItems([]);
        }
    }, []);

    useEffect(() => {
        if (open) load();
    }, [open, load, unread]);

    // Close when clicking outside.
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    const openItem = async (n: AppNotification) => {
        if (!n.readAt) await markNotificationRead(n.id);
        setOpen(false);
        onChange();
        if (n.link) router.push(n.link);
    };

    const readAll = async () => {
        await markAllNotificationsRead();
        await load();
        onChange();
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={`การแจ้งเตือน${unread ? ` (${unread} ยังไม่อ่าน)` : ""}`}
                className="relative w-9 h-9 rounded-xl bg-accent hover:bg-primary/10 flex items-center justify-center text-lg transition-colors"
            >
                🔔
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="font-semibold text-sm">การแจ้งเตือน</span>
                        {unread > 0 && (
                            <button onClick={readAll} className="text-xs text-primary hover:underline">อ่านทั้งหมด</button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {items === null ? (
                            <p className="p-4 text-sm text-muted-foreground text-center">กำลังโหลด...</p>
                        ) : items.length === 0 ? (
                            <p className="p-6 text-sm text-muted-foreground text-center">ยังไม่มีการแจ้งเตือน</p>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => openItem(n)}
                                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-border/50 last:border-0 hover:bg-accent transition-colors ${n.readAt ? "" : "bg-primary/5"}`}
                                >
                                    <span className="text-xl shrink-0">{ICONS[n.type] ?? "🔔"}</span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium">{n.title}</span>
                                        <span className="block text-xs text-muted-foreground line-clamp-2">{n.body}</span>
                                        <span className="block text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</span>
                                    </span>
                                    {!n.readAt && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
