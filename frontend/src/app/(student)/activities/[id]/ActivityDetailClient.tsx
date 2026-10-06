"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/lib/auth-context";
import { StudentData } from "@/lib/data/students";
import { ActivityData } from "@/lib/data/activities";
import { InterestWithCategory } from "@/lib/data/interests";
import { joinActivityFn, leaveActivityFn } from "@/lib/api/activities";
import { getInitials, formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Notice } from "@/components/Notice";
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
    const [notice, setNotice] = useState<string | null>(null);

    const currentStudent = user?.studentId ? allStudents.find(s => s.id === user.studentId) : null;

    if (!activity) {
        return (
            <div className="text-center py-20">
                <Icon name="info" className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-3">ไม่พบกิจกรรมนี้ อาจถูกยกเลิกไปแล้ว</p>
                <Link href="/activities" className="mt-3 inline-block text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">กลับไปหน้ากิจกรรม</Link>
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
        else setNotice(result.error ?? "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง");
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
                setNotice(err.message || "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง");
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/activities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Icon name="arrow-left" className="h-4 w-4" /> กลับไปหน้ากิจกรรม
            </Link>

            <Notice message={notice} onClose={() => setNotice(null)} />

            {/* Header */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="brand-gradient h-36 flex items-center justify-center">
                    <Icon name="target" className="h-12 w-12 text-white" />
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
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isJoined
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
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary"><Icon name="star" className="h-3.5 w-3.5" /> คุณเป็นผู้สร้าง</span>
                                <ConfirmButton onConfirm={handleDelete} confirmLabel="กดอีกครั้งเพื่อยกเลิกกิจกรรม"><span className="inline-flex items-center gap-1"><Icon name="trash" className="h-4 w-4" /> ยกเลิกกิจกรรม</span></ConfirmButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5"><Icon name="calendar" className="h-4 w-4" /> วันและเวลา</h3>
                    <p className="font-semibold">{formatDate(activity.date)}</p>
                    <p className="text-sm text-muted-foreground">{formatTime(activity.time)}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5"><Icon name="pin" className="h-4 w-4" /> สถานที่</h3>
                    <p className="font-semibold">{activity.location}</p>
                </div>
            </div>

            {/* Capacity */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">ผู้เข้าร่วม</h3>
                    <span className="text-sm font-medium tabular-nums">{activity.participants.length} / {activity.capacity}</span>
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
                <h2 className="text-lg font-semibold mb-3">ความสนใจที่เกี่ยวข้อง</h2>
                <div className="flex flex-wrap gap-2">
                    {interests.map((i) => (
                        <span key={i.id} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">{i.icon} {i.name}</span>
                    ))}
                </div>
            </div>

            {/* Created By */}
            {creator && (
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-3">ผู้สร้างกิจกรรม</h2>
                    <Link href={`/students/${creator.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(creator.name)}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{creator.name}</p>
                            <p className="text-xs text-muted-foreground">ชั้นปีที่ {creator.year}</p>
                        </div>
                    </Link>
                </div>
            )}

            {/* Participants */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">ผู้เข้าร่วม <span className="tabular-nums">({activity.participants.length})</span></h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    {activity.participants.map((pwrap) => {
                        const participant = allStudents.find(s => s.id === pwrap.studentId);
                        if (!participant) return null;
                        return (
                            <Link
                                key={participant.id}
                                href={`/students/${participant.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                    {getInitials(participant.name)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{participant.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">ชั้นปีที่ {participant.year}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
