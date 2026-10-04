"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { signIn } = useAuth();
    const [error, setError] = useState("");

    useEffect(() => {
        const token = searchParams.get("access_token");
        if (!token) {
            // Missing access_token param, send back to login
            router.replace("/login");
            return;
        }

        // Role and student profile come from the backend, which verifies the
        // token against the Core Hub JWKS - nothing is trusted from the URL.
        signIn(token)
            .then((user) => router.replace(user.role === "admin" ? "/admin/dashboard" : "/dashboard"))
            .catch((e: Error) => setError(e.message || "เข้าสู่ระบบไม่สำเร็จ"));
    }, [searchParams, router, signIn]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md text-center space-y-4">
                    <span className="text-4xl">⚠️</span>
                    <p className="text-destructive">{error}</p>
                    <Link href="/login" className="inline-block text-sm text-primary hover:underline">กลับไปหน้าเข้าสู่ระบบ →</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground mt-4">Authenticating with Core Hub...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
