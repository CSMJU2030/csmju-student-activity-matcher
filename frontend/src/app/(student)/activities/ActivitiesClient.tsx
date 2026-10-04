"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { ActivityData } from "@/lib/data/activities";
import { StudentData } from "@/lib/data/students";
import { InterestWithCategory } from "@/lib/data/interests";
import { joinActivityFn, leaveActivityFn } from "@/lib/api/activities";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ActivitiesClientProps {
    allStudents: StudentData[];
    allActivities: ActivityData[];
    allInterests: InterestWithCategory[];
    error?: string | null;
}

export function ActivitiesClient({ allStudents, allActivities, allInterests, error }: ActivitiesClientProps) {
    const { user } = useAuth();
    const router = useRouter();
    const currentStudent = user?.studentId ? allStudents.find(s => s.studentId === String(user.studentId) || s.id === String(user.studentId)) : null;
    const [search, setSearch] = useState("");

    const filteredActivities = useMemo(() => {
        if (!search) return allActivities;
        const q = search.toLowerCase();
        return allActivities.filter((a) =>
            a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
        );
    }, [allActivities, search]);

    const handleJoinLeave = async (activityId: string, isJoined: boolean) => {
        if (!currentStudent) { alert("กรุณาเข้าสู่ระบบก่อน"); return; }
        try {
            if (isJoined) {
                await leaveActivityFn(activityId);
            } else {
                await joinActivityFn(activityId);
            }
            router.refresh();
        } catch (err: any) {
            alert(err.message || "Failed to join/leave activity");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">🎯 Activities</h1>
                    <p className="text-muted-foreground mt-1">กิจกรรมที่น่าสนใจ เข้าร่วมเลย!</p>
                </div>
                <Link href="/activities/create"
                    className="px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 shadow-md shadow-primary/20 transition-all"
                >
                    ✨ สร้าง Activity ใหม่
                </Link>
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                    โหลดกิจกรรมไม่สำเร็จ: {error}
                </div>
            )}

            <input
                type="text"
                placeholder="ค้นหา Activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActivities.map((activity) => {
                    const isJoined = currentStudent ? activity.participants.some(p => p.studentId === currentStudent.id) : false;
                    const isFull = activity.participants.length >= activity.capacity;
                    const interests = allInterests.filter(i => activity.interests.some(ai => ai.interestId === i.id));
                    const fillPercent = (activity.participants.length / activity.capacity) * 100;

                    return (
                        <div key={activity.id} className="bg-card rounded-xl border border-border overflow-hidden card-hover">
                            <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-20 flex items-center justify-center">
                                <span className="text-3xl">🎯</span>
                            </div>
                            <div className="p-5">
                                <div className="font-semibold text-lg">{activity.title}</div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>

                                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                    <p>📅 {formatDate(activity.date)}</p>
                                    <p>📍 {activity.location}</p>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {interests.map((i) => (
                                        <span key={i.id} className="text-xs px-2 py-0.5 rounded-full bg-accent">
                                            {i.icon} {i.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Participants</span>
                                        <span>{activity.participants.length}/{activity.capacity}</span>
                                    </div>
                                    <div className="bg-muted rounded-full h-2">
                                        <div
                                            className={`rounded-full h-2 transition-all ${isFull ? "bg-destructive" : "gradient-primary"}`}
                                            style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border">
                                    {currentStudent?.id === activity.creatorId ? (
                                        <p className="w-full py-2 text-center text-xs font-medium rounded-lg bg-amber-100 text-amber-700">👑 คุณเป็นผู้สร้าง</p>
                                    ) : (
                                    <button
                                        onClick={() => handleJoinLeave(activity.id, isJoined)}
                                        disabled={!isJoined && isFull}
                                        className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${isJoined
                                            ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            : isFull
                                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-primary/90"
                                            }`}
                                    >
                                        {isJoined ? "ยกเลิกการเข้าร่วม" : isFull ? "เต็มแล้ว" : "เข้าร่วม"}
                                    </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredActivities.length === 0 && (
                <div className="text-center py-16">
                    <span className="text-4xl">📭</span>
                    <p className="text-muted-foreground mt-3">ไม่พบ Activity ที่ตรงกับการค้นหา</p>
                </div>
            )}
        </div>
    );
}
