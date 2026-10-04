"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openConversation } from "@/lib/api/social";

/** "💬 ทักแชท" - opens (or creates) the 1:1 chat with a student. */
export function ChatButton({ studentId, className = "", label = "💬 ทักแชท" }: { studentId: string; className?: string; label?: string }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const open = async (e: React.MouseEvent) => {
        // Usable inside a card that is itself a link.
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        setError("");
        try {
            router.push(`/chats/${await openConversation(studentId)}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เปิดแชทไม่สำเร็จ");
            setBusy(false);
        }
    };

    return (
        <span className="inline-flex flex-col items-end">
            <button
                type="button"
                onClick={open}
                disabled={busy}
                className={`px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm ${className}`}
            >
                {busy ? "กำลังเปิด..." : label}
            </button>
            {error && <span className="text-xs text-destructive mt-1">{error}</span>}
        </span>
    );
}
