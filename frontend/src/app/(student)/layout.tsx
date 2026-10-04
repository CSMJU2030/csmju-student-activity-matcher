"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
import { getUnreadCounts } from "@/lib/api/social";
import { NotificationBell } from "@/components/NotificationBell";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/discover", label: "Discover", icon: "🔍" },
    { href: "/matches", label: "Matches", icon: "💫" },
    { href: "/groups", label: "Groups", icon: "👥" },
    { href: "/activities", label: "Activities", icon: "🎯" },
    { href: "/chats", label: "Chats", icon: "💬" },
    { href: "/profile", label: "Profile", icon: "👤" },
];

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
            <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                {unread.chats > 99 ? "99+" : unread.chats}
            </span>
        ) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border shadow-sm z-40">
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
                            <span className="text-xl">🤝</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Interest Match
                            </h1>
                            <p className="text-[10px] text-muted-foreground -mt-0.5">Find Your People</p>
                        </div>
                    </Link>
                    <div className="mt-4">
                        <NotificationBell unread={unread.notifications} onChange={refreshUnread} />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                                {badge(item.href)}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(user?.name || "")}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); router.push("/login"); }}
                        className="w-full mt-2 px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors text-left"
                    >
                        🚪 ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Mobile Top Bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-b border-border z-40 px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="text-xl">🤝</span>
                        <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Interest Match
                        </span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <NotificationBell unread={unread.notifications} onChange={refreshUnread} align="right" />
                        <button
                            onClick={() => { logout(); router.push("/login"); }}
                            className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-sm"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-40">
                <div className="flex justify-around py-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                {item.href === "/chats" && unread.chats > 0 && (
                                    <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                                )}
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
                <div className="p-4 lg:p-8 page-enter">{children}</div>
            </main>
        </div>
    );
}
