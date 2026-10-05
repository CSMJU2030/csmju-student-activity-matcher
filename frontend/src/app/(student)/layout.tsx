"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
import { getUnreadCounts } from "@/lib/api/social";
import { NotificationBell } from "@/components/NotificationBell";
import { Icon, type IconName } from "@/components/Icon";
import { PortalLink } from "@/components/PortalLink";

const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
    { href: "/dashboard", label: "ภาพรวม", icon: "dashboard" },
    { href: "/discover", label: "ค้นหาเพื่อน", icon: "search" },
    { href: "/matches", label: "คนที่ใช่", icon: "sparkles" },
    { href: "/groups", label: "กลุ่ม", icon: "users" },
    { href: "/activities", label: "กิจกรรม", icon: "target" },
    { href: "/chats", label: "แชท", icon: "chat" },
    { href: "/profile", label: "โปรไฟล์", icon: "user" },
];

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const FOCUS_DARK = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy";

/**
 * App shell following ui-design-system.md 5.1: brand-gradient sidebar, 64px top
 * bar, content up to 1280px. (CsmjuAppShell itself has no notification list or
 * unread badges, which this app needs, so the shell is built here from the same
 * spec.)
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/login");
        } else if (user?.role === "admin") {
            router.replace("/admin/dashboard");
        }
    }, [isAuthenticated, user, router]);

    const isStudent = isAuthenticated && user?.role === "student";
    const [unread, setUnread] = useState({ notifications: 0, chats: 0 });
    const refreshUnread = useCallback(() => {
        getUnreadCounts().then(setUnread).catch(() => {});
    }, []);
    useEffect(() => {
        if (!isStudent) return;
        refreshUnread();
        const timer = setInterval(refreshUnread, 15000);
        return () => clearInterval(timer);
    }, [isStudent, refreshUnread, pathname]);

    if (!isStudent) return null;

    const badge = (href: string) =>
        href === "/chats" && unread.chats > 0 ? (
            <span className="ml-auto mr-4 min-w-5 h-5 px-1 rounded-full bg-error text-white text-xs font-bold tabular-nums flex items-center justify-center">
                {unread.chats > 99 ? "99+" : unread.chats}
            </span>
        ) : null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside className="brand-gradient hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 py-4 shadow-xl z-40">
                <div className="px-4 pt-4 mb-8 shrink-0">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ${FOCUS_DARK}`}
                    >
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                            <Icon name="users" className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-bold text-lg leading-tight text-gradient">Interest Match</h1>
                            <p className="text-xs text-muted-foreground">ค้นหาเพื่อนที่ใช่</p>
                        </div>
                    </Link>
                    <PortalLink className="mt-4" />
                </div>

                {/* The menu scrolls on its own so sign-out below stays on screen. */}
                <nav className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-label="เมนูหลัก">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`flex items-center gap-3 py-3 text-sm font-semibold duration-200 ${FOCUS_DARK} ${isActive
                                                ? "border-l-4 border-ring bg-white/10 pl-6 text-white"
                                                : "pl-7 text-white/70 transition-all hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                                        {item.label}
                                        {badge(item.href)}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="mx-4 mt-4 shrink-0">
                    <button
                        type="button"
                        onClick={logout}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 ${FOCUS_DARK}`}
                    >
                        <Icon name="logout" className="h-4 w-4" />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Desktop top bar */}
            <header className="hidden lg:flex fixed top-0 right-0 left-64 h-16 items-center justify-end gap-3 border-b border-border bg-card px-8 shadow-sm z-30">
                <NotificationBell unread={unread.notifications} onChange={refreshUnread} align="right" />
                <div className="flex items-center gap-2 pl-1">
                    <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary text-sm font-semibold text-white shadow-sm"
                    >
                        {getInitials(user?.name || "")}
                    </span>
                    <div className="leading-tight">
                        <p className="max-w-48 truncate text-sm font-semibold">{user?.name}</p>
                        <p className="max-w-48 truncate text-xs text-muted-foreground">นักศึกษา</p>
                    </div>
                </div>
            </header>

            {/* Mobile top bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center bg-card border-b border-border shadow-sm z-40 px-4">
                <div className="flex w-full items-center justify-between">
                    <Link href="/dashboard" className={`flex items-center gap-2 rounded-lg ${FOCUS}`}>
                        <Icon name="users" className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg text-gradient">Interest Match</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <NotificationBell unread={unread.notifications} onChange={refreshUnread} align="right" />
                        <button
                            type="button"
                            onClick={logout}
                            aria-label="ออกจากระบบ"
                            className={`w-10 h-10 rounded-lg bg-accent flex items-center justify-center ${FOCUS}`}
                        >
                            <Icon name="logout" className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile bottom navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40" aria-label="เมนูหลัก">
                <div className="flex justify-between overflow-x-auto py-2 px-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`relative flex flex-col items-center gap-0.5 py-1 px-2 shrink-0 rounded-lg transition-colors ${FOCUS} ${isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                {item.href === "/chats" && unread.chats > 0 && (
                                    <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-error" />
                                )}
                                <Icon name={item.icon} />
                                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main content */}
            <main className="lg:pl-64 pt-16 pb-20 lg:pb-0 min-h-screen">
                <div className="mx-auto w-full max-w-[1280px] p-4 lg:p-10 animate-in fade-in">{children}</div>
            </main>
        </div>
    );
}
