"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";

// `short` is the bottom-bar label on phones.
const NAV_ITEMS: { href: string; label: string; short?: string; icon: IconName }[] = [
    { href: "/admin/dashboard", label: "ภาพรวม", icon: "dashboard" },
    { href: "/admin/students", label: "นักศึกษา", icon: "graduation" },
    { href: "/admin/interests", label: "ความสนใจ", icon: "sparkles" },
    { href: "/admin/catalog", label: "หมวดหมู่ & กำลังหา", short: "หมวดหมู่", icon: "folder" },
    { href: "/admin/groups", label: "กลุ่ม", icon: "users" },
    { href: "/admin/activities", label: "กิจกรรม", icon: "target" },
    { href: "/admin/sync", label: "ซิงก์ข้อมูล REG", short: "ซิงก์", icon: "refresh" },
];

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const FOCUS_DARK = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy";

/** Back-office shell, same spec as the student one (ui-design-system.md 5.1). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/login");
        } else if (user?.role !== "admin") {
            router.replace("/dashboard");
        }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated || user?.role !== "admin") return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside className="brand-gradient hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 py-4 shadow-xl z-40">
                <div className="px-4 pt-4 mb-8 shrink-0">
                    <Link
                        href="/admin/dashboard"
                        className={`flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ${FOCUS_DARK}`}
                    >
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                            <Icon name="shield" className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-bold text-lg leading-tight text-foreground">แผงผู้ดูแล</h1>
                            <p className="text-xs text-muted-foreground">Interest Match</p>
                        </div>
                    </Link>
                </div>

                {/* The menu scrolls on its own so sign-out below stays on screen. */}
                <nav className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-label="เมนูผู้ดูแล">
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
                <div className="flex items-center gap-2">
                    <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary text-sm font-semibold text-white shadow-sm"
                    >
                        {getInitials(user?.name || user?.email || "")}
                    </span>
                    <div className="leading-tight">
                        <p className="max-w-48 truncate text-sm font-semibold">{user?.name || user?.email}</p>
                        <p className="max-w-48 truncate text-xs text-muted-foreground">ผู้ดูแลระบบ</p>
                    </div>
                </div>
            </header>

            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between brand-gradient text-white shadow-sm z-40 px-4">
                <span className="font-bold flex items-center gap-2">
                    <Icon name="shield" className="h-5 w-5" />
                    แผงผู้ดูแล
                </span>
                <button
                    type="button"
                    onClick={logout}
                    aria-label="ออกจากระบบ"
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/10 ${FOCUS_DARK}`}
                >
                    <Icon name="logout" />
                </button>
            </header>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 brand-gradient z-40" aria-label="เมนูผู้ดูแล">
                <div className="flex justify-between overflow-x-auto py-2 px-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex flex-col items-center gap-0.5 py-1 px-2 shrink-0 rounded-lg transition-colors ${FOCUS_DARK} ${isActive ? "text-white" : "text-white/70"
                                    }`}
                            >
                                <Icon name={item.icon} />
                                <span className="text-xs font-medium whitespace-nowrap">{item.short ?? item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <main className="lg:pl-64 pt-16 pb-20 lg:pb-0 min-h-screen">
                <div className="mx-auto w-full max-w-[1280px] p-4 lg:p-10 animate-in fade-in">{children}</div>
            </main>
        </div>
    );
}
