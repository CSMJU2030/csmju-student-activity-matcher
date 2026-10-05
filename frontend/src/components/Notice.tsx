/**
 * Inline error banner that replaces window.alert(): alert() blocks the whole
 * page until dismissed and cannot be styled. Renders nothing when there is no
 * message. Same look as the other error banners in the app.
 */
export function Notice({ message, onClose }: { message: string | null; onClose?: () => void }) {
    if (!message) return null;
    return (
        <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-error/30 bg-error-container text-on-error-container px-4 py-3 text-sm"
        >
            <span>{message}</span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="ปิดข้อความ"
                    className="shrink-0 rounded-md px-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    ×
                </button>
            )}
        </div>
    );
}
