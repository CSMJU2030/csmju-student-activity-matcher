"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConversationSummary, listConversations, timeAgo } from "@/lib/api/social";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";

const POLL_MS = 10000;

export default function ChatsPage() {
    const { user } = useAuth();
    const [chats, setChats] = useState<ConversationSummary[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        const load = () =>
            listConversations()
                .then((c) => { if (alive) { setChats(c); setError(""); } })
                .catch(() => { if (alive) setError("โหลดแชทไม่สำเร็จ"); });
        load();
        const timer = setInterval(load, POLL_MS);
        return () => { alive = false; clearInterval(timer); };
    }, []);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">💬 Chats</h1>
                <p className="text-muted-foreground mt-1">คุยกับเพื่อนที่สนใจเรื่องเดียวกัน</p>
            </div>

            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

            {chats === null ? (
                <p className="text-center py-16 text-muted-foreground">กำลังโหลด...</p>
            ) : chats.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <span className="text-4xl">💬</span>
                    <p className="mt-3 font-medium">ยังไม่มีแชท</p>
                    <p className="text-sm text-muted-foreground mt-1">ไปที่หน้า Matches แล้วกด &quot;ทักแชท&quot; คนที่สนใจเหมือนกันได้เลย</p>
                    <Link href="/matches" className="inline-block mt-4 px-4 py-2 rounded-xl gradient-primary text-white text-sm">ไปหน้า Matches →</Link>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {chats.map((c) => {
                        const mine = c.lastMessage?.senderId === user?.studentId;
                        return (
                            <Link key={c.id} href={`/chats/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shrink-0">
                                    {getInitials(c.other.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className={`truncate ${c.unreadCount ? "font-bold" : "font-medium"}`}>{c.other.name}</p>
                                        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(c.lastMessageAt)}</span>
                                    </div>
                                    <p className={`text-sm truncate ${c.unreadCount ? "text-foreground" : "text-muted-foreground"}`}>
                                        {c.lastMessage ? `${mine ? "คุณ: " : ""}${c.lastMessage.body}` : "เริ่มคุยกันได้เลย 👋"}
                                    </p>
                                </div>
                                {c.unreadCount > 0 && (
                                    <span className="min-w-6 h-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                                        {c.unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
