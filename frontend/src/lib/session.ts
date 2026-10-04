"use client";

import { User } from "@/types";
import { setTokenCookie, clearTokenCookie } from "@/lib/actions";
import { ACCESS_TOKEN_KEY, fetchJsonWithAuth } from "@/lib/api/apiClient";

export const USER_KEY = "interest-match-user";

interface MeResponse {
    id: string;
    email: string;
    coreRole: string;
    subsystemRole: "STUDENT" | "ALUMNI" | "ADMIN";
}

/**
 * Turns a Core Hub access token into the app's session (shared by the mock
 * login and the SSO callback). Who the user is - role and student profile -
 * comes from the backend (`/me`, `/students/me`), which verifies the token;
 * nothing is guessed from decoding the JWT in the browser.
 */
export async function establishSession(token: string): Promise<User> {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    await setTokenCookie(token);

    let me: MeResponse;
    try {
        me = await fetchJsonWithAuth("/me");
    } catch {
        clearSession();
        throw new Error("Core Hub token was rejected by Interest Match");
    }

    const isAdmin = me.subsystemRole === "ADMIN";
    // Student.id of the logged-in user. Admins usually have no student profile.
    const student = isAdmin ? null : await fetchJsonWithAuth("/students/me").catch(() => null);
    if (!isAdmin && !student) {
        clearSession();
        throw new Error("ไม่พบโปรไฟล์นักศึกษาของบัญชีนี้ — ให้ผู้ดูแลระบบ Sync ข้อมูลจาก REG ก่อน");
    }

    const user: User = {
        id: me.id,
        email: me.email,
        role: isAdmin ? "admin" : "student",
        name: student?.name ?? me.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${me.id}`,
        studentId: student?.id,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
}

export function clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    clearTokenCookie().catch(() => {});
}

/** Seconds until the stored token expires (<= 0 when expired or unreadable). */
export function tokenSecondsLeft(token: string | null): number {
    if (!token) return 0;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return typeof payload.exp === "number" ? payload.exp - Date.now() / 1000 : 0;
    } catch {
        return 0;
    }
}
