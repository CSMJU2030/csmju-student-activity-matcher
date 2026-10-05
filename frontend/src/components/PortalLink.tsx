import { Icon } from "@/components/Icon";

/**
 * "Back to CSMJU Portal" link that every subsystem shows in its side nav
 * (ui-design-system.md 1, 5.1). It is a real navigation to the Core Hub web
 * origin, so a plain <a>. Nothing is rendered when CORE_HUB_WEB_URL is unset.
 * `href` is only a prop so tests can pass it; the app reads the env default.
 */
export function PortalLink({
    href = process.env.NEXT_PUBLIC_CORE_HUB_WEB_URL,
    className = "",
}: {
    href?: string;
    className?: string;
}) {
    if (!href) return null;
    return (
        <a
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy ${className}`}
        >
            <Icon name="arrow-left" className="h-4 w-4 shrink-0" />
            กลับ CSMJU Portal
        </a>
    );
}
