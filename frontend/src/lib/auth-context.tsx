"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User } from "@/types";
import { ACCESS_TOKEN_KEY } from "@/lib/api/apiClient";
import { USER_KEY, clearSession, establishSession, tokenSecondsLeft } from "@/lib/session";

export interface AuthState {
    user: User | null;
    token?: string;
    isAuthenticated: boolean;
    /** Verify a Core Hub access token with the backend and start the session. */
    signIn: (token: string) => Promise<User>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore the saved session, unless its Core Hub token has expired.
        const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const saved = localStorage.getItem(USER_KEY);
        if (saved && savedToken && tokenSecondsLeft(savedToken) > 0) {
            try {
                setUser(JSON.parse(saved));
                setToken(savedToken);
            } catch {
                clearSession();
            }
            // Re-resolve role and student profile in the background, so sessions
            // saved by an older version (or after a role change) stay correct.
            establishSession(savedToken)
                .then(setUser)
                .catch(() => {
                    clearSession();
                    setUser(null);
                    setToken(undefined);
                });
        } else if (saved || savedToken) {
            clearSession();
        }
        setIsLoading(false);
    }, []);

    const signIn = useCallback(async (newToken: string) => {
        const signedIn = await establishSession(newToken);
        setUser(signedIn);
        setToken(newToken);
        return signedIn;
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
        setToken(undefined);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, signIn, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
