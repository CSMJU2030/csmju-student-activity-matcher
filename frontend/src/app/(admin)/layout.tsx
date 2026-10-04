"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// `short` is the bottom-bar label on phones.
const NAV_ITEMS: { href: string; label: string; short?: string; icon: string }[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/students", label: "Students", icon: "🎓" },
    { href: "/admin/interests", label: "Interests", icon: "✨" },
    { href: "/admin/catalog", label: "หมวดหมู่ & กำลังหา", short: "หมวดหมู่", icon: "🗂️" },
    { href: "/admin/groups", label: "Groups", icon: "👥" },
    { href: "/admin/activities", label: "Activities", icon: "🎯" },
    { href: "/admin/sync", label: "Sync REG", short: "Sync", icon: "🔄" },
];

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-foreground text-white z-40">
                <div className="p-6 border-b border-white/10">
                    <Link href="/admin/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-card/10 flex items-center justify-center">
                            <span className="text-xl">🛡️</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Admin Panel</h1>
                            <p className="text-[10px] text-white/50 -mt-0.5">Interest Match</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-card/10 text-white" : "text-white/60 hover:bg-card/5 hover:text-white"
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-white/50">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => { logout(); router.push("/login"); }}
                        className="w-full px-4 py-2 text-sm text-white/60 hover:text-secondary-foreground hover:bg-card/5 rounded-lg transition-colors text-left"
                    >
                        🚪 ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 bg-foreground text-white z-40 px-4 py-3">
                <div className="flex items-center justify-between">
                    <span className="font-bold">🛡️ Admin Panel</span>
                    <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-white/60">🚪</button>
                </div>
            </header>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-foreground z-40">
                <div className="flex justify-between overflow-x-auto py-2 px-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex flex-col items-center gap-0.5 py-1 px-2 shrink-0 transition-colors ${isActive ? "text-white" : "text-white/40"
                                    }`}>
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-[10px] font-medium whitespace-nowrap">{item.short ?? item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
                <div className="p-4 lg:p-8 page-enter">{children}</div>
            </main>
        </div>
    );
}
