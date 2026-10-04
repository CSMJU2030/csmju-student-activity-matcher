"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/lib/auth-context";
import { StudentData } from "@/lib/data/students";
import { ActivityData } from "@/lib/data/activities";
import { InterestWithCategory } from "@/lib/data/interests";
import { joinActivityFn, leaveActivityFn } from "@/lib/api/activities";
import { getInitials, formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteActivity } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface ActivityClientProps {
    activity: ActivityData;
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
}

export function ActivityDetailClient({ activity, allStudents, allInterests }: ActivityClientProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const currentStudent = user?.studentId ? allStudents.find(s => s.id === user.studentId) : null;

    if (!activity) {
        return (
            <div className="text-center py-20">
                <span className="text-4xl">😔</span>
                <p className="text-muted-foreground mt-3">ไม่พบ Activity</p>
                <Link href="/activities" className="mt-3 inline-block text-sm text-primary hover:underline">กลับ →</Link>
            </div>
        );
    }

    const interests = allInterests.filter(i => activity.interests.some(ai => ai.interestId === i.id));
    const isJoined = currentStudent ? activity.participants.some(p => p.studentId === currentStudent.id) : false;
    const isCreator = currentStudent?.id === activity.creatorId;
    const isFull = activity.participants.length >= activity.capacity;
    const creator = allStudents.find(s => s.id === activity.creatorId);
    const fillPercent = (activity.participants.length / activity.capacity) * 100;

    const handleDelete = async () => {
        const result = await deleteActivity(activity.id);
        if (result.success) router.push("/activities");
        else alert(result.error);
    };

    const handleJoinLeave = async () => {
        if (!currentStudent) return;
        startTransition(async () => {
            try {
                if (isJoined) {
                    await leaveActivityFn(activity.id);
                } else {
                    await joinActivityFn(activity.id);
                }
                router.refresh();
            } catch (err: any) {
                alert(err.message || "Failed to join/leave activity");
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/activities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                ← กลับไปหน้า Activities
            </Link>

            {/* Header */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-36 flex items-center justify-center">
                    <span className="text-5xl">🎯</span>
                </div>
                <div className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{activity.title}</h1>
                            <p className="text-sm text-muted-foreground mt-2">{activity.description}</p>
                        </div>
                        {!isCreator && (
                            <button
                                onClick={handleJoinLeave}
                                disabled={isPending || (!isJoined && isFull)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isJoined
                                    ? "bg-muted hover:bg-destructive/10 hover:text-destructive"
                                    : isFull
                                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                                        : "gradient-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
                                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {isPending ? "กำลังอัปเดต..." : isJoined ? "ยกเลิกการเข้าร่วม" : isFull ? "เต็มแล้ว" : "เข้าร่วม"}
                            </button>
                        )}
                        {isCreator && (
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">👑 คุณเป็นผู้สร้าง</span>
                                <ConfirmButton onConfirm={handleDelete} confirmLabel="กดอีกครั้งเพื่อยกเลิกกิจกรรม">🗑️ ยกเลิกกิจกรรม</ConfirmButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">📅 Date & Time</h3>
                    <p className="font-semibold">{formatDate(activity.date)}</p>
                    <p className="text-sm text-muted-foreground">{formatTime(activity.time)}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">📍 Location</h3>
                    <p className="font-semibold">{activity.location}</p>
                </div>
            </div>

            {/* Capacity */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">Participants</h3>
                    <span className="text-sm font-medium">{activity.participants.length} / {activity.capacity}</span>
                </div>
                <div className="bg-muted rounded-full h-3">
                    <div
                        className={`rounded-full h-3 transition-all ${isFull ? "bg-destructive" : "gradient-primary"}`}
                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                    />
                </div>
                {isFull && <p className="text-xs text-destructive mt-2">กิจกรรมนี้เต็มแล้ว</p>}
            </div>

            {/* Interests */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-3">Related Interests</h2>
                <div className="flex flex-wrap gap-2">
                    {interests.map((i) => (
                        <span key={i.id} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">{i.icon} {i.name}</span>
                    ))}
                </div>
            </div>

            {/* Created By */}
            {creator && (
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-3">Created By</h2>
                    <Link href={`/students/${creator.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(creator.name)}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{creator.name}</p>
                            <p className="text-xs text-muted-foreground">Year {creator.year}</p>
                        </div>
                    </Link>
                </div>
            )}

            {/* Participants */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Participants ({activity.participants.length})</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    {activity.participants.map((pwrap) => {
                        const participant = allStudents.find(s => s.id === pwrap.studentId);
                        if (!participant) return null;
                        return (
                            <Link
                                key={participant.id}
                                href={`/students/${participant.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                    {getInitials(participant.name)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{participant.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">Year {participant.year}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
