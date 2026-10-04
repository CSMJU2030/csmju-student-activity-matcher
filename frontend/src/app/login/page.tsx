"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Icon, type IconName } from "@/components/Icon";

/** Dev-only shortcut accounts (the Core Hub seed). Hidden in production builds. */
const MOCK_ACCOUNTS: { email: string; label: string; icon: IconName }[] = [
    { email: "student@core.local", label: "บัญชีนักศึกษา", icon: "graduation" },
    { email: "admin@core.local", label: "บัญชีผู้ดูแลระบบ", icon: "shield" },
];
const SHOW_MOCK = process.env.NODE_ENV !== "production";

/**
 * The subsystem has no login form of its own (auth-contract §9): signing in
 * means going through Core Hub via GET /auth/login.
 */
export default function LoginPage() {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState<string | null>(null);
    const { user, refresh, sessionError } = useAuth();
    const router = useRouter();

    // Already signed in: skip this page.
    useEffect(() => {
        if (user) router.replace(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }, [user, router]);

    const signInWithCoreHub = () => {
        setBusy("sso");
        window.location.assign("/auth/login?next=%2F");
    };

    const mockLogin = async (email: string) => {
        setBusy(email);
        setError("");
        try {
            // Sets the same HttpOnly session cookie as the SSO callback.
            const res = await fetch("/api/auth/mock-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error?.message || "เข้าสู่ระบบไม่สำเร็จ");
            }
            const signedIn = await refresh();
            if (!signedIn) throw new Error("เข้าสู่ระบบไม่สำเร็จ");
            router.push(signedIn.role === "admin" ? "/admin/dashboard" : "/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
            setBusy(null);
        }
    };

    const shownError = error || sessionError;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-md mb-4">
                        <Icon name="users" className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">
                        Interest Match
                    </h1>
                    <p className="text-muted-foreground mt-2">ค้นหาเพื่อนที่มีความสนใจเหมือนกัน</p>
                </div>

                <div className="bg-card rounded-2xl shadow-md border border-primary/20 p-8 space-y-5">
                    <button
                        type="button"
                        onClick={signInWithCoreHub}
                        disabled={busy !== null}
                        className="w-full py-3 px-4 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        {busy === "sso" ? "กำลังไปที่ Core Hub..." : "เข้าสู่ระบบผ่าน Core Hub (SSO)"}
                    </button>
                    <p className="text-sm text-muted-foreground text-center">ใช้บัญชีเดียวกับ CSMJU Core Hub — ระบบนี้ไม่มีรหัสผ่านของตัวเอง</p>

                    {shownError && (
                        <div role="alert" className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{shownError}</div>
                    )}

                    {SHOW_MOCK && (
                        <div className="pt-5 border-t border-border">
                            <p className="text-sm text-muted-foreground text-center mb-3">โหมดพัฒนา: เข้าด้วยบัญชีทดสอบของ Core Hub</p>
                            <div className="space-y-2">
                                {MOCK_ACCOUNTS.map((account) => (
                                    <button
                                        key={account.email}
                                        type="button"
                                        onClick={() => mockLogin(account.email)}
                                        disabled={busy !== null}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors text-left disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <span className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center"><Icon name={account.icon} className="h-4 w-4" /></span>
                                        <div>
                                            <p className="text-sm font-medium">{busy === account.email ? "กำลังเข้าสู่ระบบ..." : account.label}</p>
                                            <p className="text-xs text-muted-foreground">{account.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">Interest Match · CSMJU2030</p>
            </div>
        </div>
    );
}
