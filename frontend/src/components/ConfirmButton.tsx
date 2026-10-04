"use client";

import { useEffect, useState } from "react";

/**
 * Two-step destructive button: the first click arms it ("ยืนยัน?"), the second
 * runs the action. Avoids the blocking window.confirm dialog.
 */
export function ConfirmButton({
    onConfirm,
    children,
    confirmLabel = "ยืนยัน?",
    disabled,
    className = "",
}: {
    onConfirm: () => void | Promise<void>;
    children: React.ReactNode;
    confirmLabel?: string;
    disabled?: boolean;
    className?: string;
}) {
    const [armed, setArmed] = useState(false);
    const [busy, setBusy] = useState(false);

    // Disarm after a few seconds so a stray later click does nothing.
    useEffect(() => {
        if (!armed) return;
        const t = setTimeout(() => setArmed(false), 4000);
        return () => clearTimeout(t);
    }, [armed]);

    const click = async () => {
        if (!armed) return setArmed(true);
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
            setArmed(false);
        }
    };

    return (
        <button
            type="button"
            onClick={click}
            disabled={disabled || busy}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${armed ? "bg-destructive text-white" : "text-destructive hover:bg-destructive/10"} ${className}`}
        >
            {busy ? "กำลังทำ..." : armed ? confirmLabel : children}
        </button>
    );
}
