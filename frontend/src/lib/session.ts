"use client";

import { User } from "@/types";
import { fetchJsonWithAuth } from "@/lib/api/apiClient";

interface MeResponse {
    id: string;
    email: string;
    coreRole: string;
    subsystemRole: "STUDENT" | "ALUMNI" | "ADMIN";
    session?: { expiresAt: string | null };
}

export class NoStudentProfileError extends Error {
    constructor() {
        super("ไม่พบโปรไฟล์นักศึกษาของบัญชีนี้ — ให้ผู้ดูแลระบบ Sync ข้อมูลจาก REG ก่อน");
    }
}

/**
 * Who is signed in, according to the backend. The session itself is the
 * HttpOnly cookie set by the SSO callback (or the dev mock login); role and
 * student profile come from `/me` and `/students/me`, which verify it.
 * Returns null when there is no valid session.
 */
export async function loadSession(): Promise<User | null> {
    let me: MeResponse;
    try {
        // reauth: false - being signed out is a normal state here, not an expired session
        me = await fetchJsonWithAuth("/me", { reauth: false });
    } catch {
        return null;
    }

    const isAdmin = me.subsystemRole === "ADMIN";
    // Student.id of the signed-in user. Admins usually have no student profile.
    const student = isAdmin ? null : await fetchJsonWithAuth("/students/me", { reauth: false }).catch(() => null);
    if (!isAdmin && !student) throw new NoStudentProfileError();

    return {
        id: me.id,
        email: me.email,
        role: isAdmin ? "admin" : "student",
        name: student?.name ?? me.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${me.id}`,
        studentId: student?.id,
        sessionExpiresAt: me.session?.expiresAt ?? undefined,
    };
}

/**
 * Sign-out is platform-wide (auth-contract §7): POST /auth/logout clears our
 * cookies and the backend sends the browser on to Core Hub's logout page.
 * A real form submit, because the answer is a 303 to another origin.
 */
export function logoutEverywhere() {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/auth/logout";
    document.body.appendChild(form);
    form.submit();
}
