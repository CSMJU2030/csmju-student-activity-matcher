"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User } from "@/types";
import { NoStudentProfileError, loadSession, logoutEverywhere } from "@/lib/session";

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    /** Why the last session check failed (e.g. no student profile), if it did. */
    sessionError: string | null;
    /** Re-read the session from the backend (after the dev mock login sets the cookie). */
    refresh: () => Promise<User | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const signedIn = await loadSession();
            setUser(signedIn);
            setSessionError(null);
            return signedIn;
        } catch (error) {
            setUser(null);
            setSessionError(error instanceof NoStudentProfileError ? error.message : "ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ");
            return null;
        }
    }, []);

    // The session is the HttpOnly cookie - ask the backend who it belongs to.
    useEffect(() => {
        refresh().finally(() => setIsLoading(false));
    }, [refresh]);

    const logout = useCallback(() => {
        setUser(null);
        logoutEverywhere();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, sessionError, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
