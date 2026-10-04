"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChatMessage, StudentCard, getMessages, sendMessage } from "@/lib/api/social";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";

// Basic chat: new messages are fetched every few seconds (no websocket).
const POLL_MS = 3000;

function timeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [other, setOther] = useState<StudentCard | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastAt = useRef<string | undefined>(undefined);

    const merge = useCallback((incoming: ChatMessage[]) => {
        if (incoming.length === 0) return;
        setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const next = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
            lastAt.current = next[next.length - 1]?.createdAt;
            return next;
        });
    }, []);

    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const res = await getMessages(id, lastAt.current);
                if (!alive) return;
                setOther(res.other);
                merge(res.messages);
            } catch {
                if (alive && !lastAt.current) setNotFound(true);
            }
        };
        poll();
        const timer = setInterval(poll, POLL_MS);
        return () => { alive = false; clearInterval(timer); };
    }, [id, merge]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        setError("");
        try {
            merge([await sendMessage(id, body)]);
            setText("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "ส่งไม่สำเร็จ");
        } finally {
            setSending(false);
        }
    };

    if (notFound) {
        return (
            <div className="text-center py-20">
                <span className="text-4xl">😔</span>
                <p className="text-muted-foreground mt-3">ไม่พบแชทนี้</p>
                <Link href="/chats" className="mt-3 inline-block text-sm text-primary hover:underline">กลับไปหน้าแชท →</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-4rem)] bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Link href="/chats" className="text-muted-foreground hover:text-primary text-lg" aria-label="กลับ">←</Link>
                {other && (
                    <Link href={`/students/${other.id}`} className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                            {getInitials(other.name)}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold truncate">{other.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{other.program} · ปี {other.year}</p>
                        </div>
                    </Link>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
                {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-10">ยังไม่มีข้อความ — ทักทายกันก่อนเลย 👋</p>
                )}
                {messages.map((m) => {
                    const mine = m.senderId === user?.studentId;
                    return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? "gradient-primary text-white rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
                                {m.body}
                                <span className={`block text-[10px] mt-1 ${mine ? "text-white/70 text-right" : "text-muted-foreground"}`}>{timeLabel(m.createdAt)}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={2000}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button type="submit" disabled={sending || !text.trim()}
                    className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-40">
                    ส่ง
                </button>
            </form>
            {error && <p className="px-4 pb-2 text-xs text-destructive">{error}</p>}
        </div>
    );
}
