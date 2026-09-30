"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const success = await login(email);
        if (success) {
            const isAdmin = email.toLowerCase() === "admin@example.com";
            router.push(isAdmin ? "/admin/dashboard" : "/dashboard");
        } else {
            setError("อีเมลไม่ถูกต้อง กรุณาลองใหม่");
        }
        setIsLoading(false);
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
                                "เข้าสู่ระบบ"
                            )}
                        </button>
                    </form>

                    {/* Mock Credentials */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center mb-3">ทดลองใช้งานด้วย Mock Account</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => setEmail("student@example.com")}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors text-left"
                            >
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">🎓</span>
                                <div>
                                    <p className="text-sm font-medium">Student Account</p>
                                    <p className="text-xs text-muted-foreground">student@example.com</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setEmail("admin@example.com")}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors text-left"
                            >
                                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">🛡️</span>
                                <div>
                                    <p className="text-sm font-medium">Admin Account</p>
                                    <p className="text-xs text-muted-foreground">admin@example.com</p>
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
