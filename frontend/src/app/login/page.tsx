"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1").replace(/\/v1\/?$/, "");

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, user } = useAuth();
    const router = useRouter();

    // Already signed in (session restored from a valid token): skip the login form.
    useEffect(() => {
        if (user) router.replace(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }, [user, router]);

    const handleMockLogin = async (mockEmail: string) => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_ORIGIN}/auth/mock-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: mockEmail })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || data.message || "Mock login failed");

            // Look in data.data if the response interceptor wrapped it, otherwise direct
            const token = data.data?.access_token || data.access_token;
            if (!token) throw new Error("No access token provided by the server");

            // Role and student profile are resolved by the backend from the verified token.
            const user = await signIn(token);
            router.push(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to connect to backend for mock token: " + err.message);
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail.endsWith("@core.local")) {
            await handleMockLogin(trimmedEmail);
        } else {
            window.location.href = process.env.NEXT_PUBLIC_CORE_HUB_URL || "http://localhost:3100";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg shadow-primary/20 mb-4">
                        <span className="text-3xl">🤝</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Interest Match
                    </h1>
                    <p className="text-muted-foreground mt-2">ค้นหาเพื่อนที่มีความสนใจเหมือนกัน</p>
                </div>

                {/* Login Card */}
                <div className="bg-card rounded-2xl shadow-xl shadow-primary/20 border border-primary/20 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="กรอกอีเมลเพื่อเข้าสู่ระบบ"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                            {isLoading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    กำลังเข้าสู่ระบบ...
                                </span>
                            ) : (
                                "เข้าสู่ระบบ (SSO)"
                            )}
                        </button>
                    </form>

                    {/* Mock Credentials */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center mb-3">ทดลองใช้งานด้วย Mock Account</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => setEmail("student@core.local")}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors text-left"
                                type="button"
                            >
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">🎓</span>
                                <div>
                                    <p className="text-sm font-medium">Student Account</p>
                                    <p className="text-xs text-muted-foreground">student@core.local</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setEmail("admin@core.local")}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors text-left"
                                type="button"
                            >
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">🛡️</span>
                                <div>
                                    <p className="text-sm font-medium">Admin Account</p>
                                    <p className="text-xs text-muted-foreground">admin@core.local</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Interest Match · MIS Project · Prototype V1
                </p>
            </div>
        </div>
    );
}
