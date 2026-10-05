/**
 * Small stroke-icon set (24x24, inherits `currentColor`) used instead of emoji
 * on screens (ui-design-system.md 16.2). Add a name here before using it.
 */
const PATHS = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    search: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z",
    sparkles: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z",
    users: "M17 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 005 18.5V20M11 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19 20v-1.5a3.5 3.5 0 00-2.5-3.35M15.5 5.2a3.5 3.5 0 010 6.6",
    target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z",
    chat: "M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z",
    user: "M20 21v-1.5a4.5 4.5 0 00-4.5-4.5h-7A4.5 4.5 0 004 19.5V21M12 11a4 4 0 100-8 4 4 0 000 8z",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
    shield: "M12 3l8 3v6c0 4.5-3.2 8.3-8 9.5C7.2 20.3 4 16.5 4 12V6l8-3z",
    graduation: "M2 9l10-5 10 5-10 5L2 9zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5",
    tag: "M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9zM8 8h.01",
    folder: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
    refresh: "M21 12a9 9 0 01-15.4 6.4L3 16M3 12a9 9 0 0115.4-6.4L21 8M21 3v5h-5M3 21v-5h5",
    calendar: "M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
    pin: "M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    plus: "M12 5v14M5 12h14",
    edit: "M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4zM13.5 6.5l4 4",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3",
    check: "M5 12.5l4.5 4.5L19 7.5",
    x: "M6 6l12 12M18 6L6 18",
    bell: "M6 9a6 6 0 1112 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 004 0",
    send: "M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z",
    heart: "M12 20s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 5.8-8 11-8 11z",
    clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
    mail: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6",
    info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01",
    alert: "M12 3l10 18H2L12 3zM12 10v4M12 17h.01",
    "arrow-left": "M19 12H5M11 6l-6 6 6 6",
    "chevron-right": "M9 6l6 6-6 6",
    star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z",
    lock: "M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1zM8 11V8a4 4 0 018 0v3",
    upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
    filter: "M3 5h18l-7 8v6l-4 2v-8L3 5z",
    globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21M12 3C9.5 5.7 8.2 8.7 8.2 12S9.5 18.3 12 21",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d={PATHS[name]} />
        </svg>
    );
}
