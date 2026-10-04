"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDashboardData } from "@/lib/actions";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export function DashboardClient({ allStudents }: { allStudents: any[] }) {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const student = useMemo(() => {
        return user?.studentId ? allStudents.find(s => s.studentId === String(user.studentId) || s.id === String(user.studentId)) : null;
    }, [user, allStudents]);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!student) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const res = await getDashboardData(student.id);
                if (cancelled) return;
                if (!res) throw new Error("Failed to load dashboard data.");
                setData(res);
            } catch (e: any) {
                if (cancelled) return;
                console.error(e);
                setError(e?.message || "Failed to load dashboard data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [student]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-pulse" role="status" aria-label="กำลังโหลดข้อมูล">
                <div className="h-32 rounded-2xl bg-muted" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-muted" />)}
                </div>
                <div className="h-28 rounded-xl bg-muted" />
            </div>
        );
    }
    if (!student) {
        return (
            <div className="max-w-md mx-auto text-center py-20 space-y-2">
                <p className="font-semibold">ยังไม่พบโปรไฟล์นักศึกษาของบัญชีนี้</p>
                <p className="text-sm text-muted-foreground">กรุณาติดต่อผู้ดูแลระบบเพื่อซิงก์ข้อมูลจากระบบ REG</p>
            </div>
        );
    }
    if (error || !data) {
        return (
            <div className="max-w-md mx-auto text-center py-20 space-y-3" role="alert">
                <p className="font-semibold text-destructive">โหลดข้อมูลไม่สำเร็จ</p>
                <p className="text-sm text-muted-foreground">{error || "ลองรีเฟรชหน้านี้อีกครั้ง"}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    ลองใหม่
                </button>
            </div>
        );
    }

    const { studentInterests, groupsCount, activitiesCount, topMatches, upcomingActivities, recommendedGroups } = data;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="brand-gradient rounded-2xl p-8 text-white shadow-md">
                <h1 className="text-2xl lg:text-3xl font-bold">
                    สวัสดี คุณ{student.name.split(" ")[0]}
                </h1>
                <p className="text-white/90 mt-2 leading-relaxed">มาหาเพื่อนร่วมสาขาวิทยาการคอมพิวเตอร์ที่มีความสนใจเหมือนกันวันนี้</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "ความสนใจของฉัน", value: studentInterests.length, icon: "sparkles", color: "bg-primary/10 text-primary" },
                    { label: "กลุ่มที่เข้าร่วม", value: groupsCount, icon: "users", color: "bg-primary/10 text-primary" },
                    { label: "คนที่เข้ากับฉัน", value: topMatches.length, icon: "search", color: "bg-primary/10 text-primary" },
                    { label: "กิจกรรมที่เข้าร่วม", value: activitiesCount, icon: "target", color: "bg-primary/10 text-primary" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl border border-border p-5 transition-shadow hover:shadow-md">
                        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                            <Icon name={stat.icon as "sparkles"} />
                        </div>
                        <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Your Interests */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">ความสนใจของคุณ</h2>
                    <Link href="/profile" className="text-sm text-primary hover:underline">
                        แก้ไข →
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                    {studentInterests.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            ยังไม่ได้เลือกความสนใจ — <Link href="/profile" className="text-primary underline">เพิ่มความสนใจ</Link> เพื่อให้เราแนะนำเพื่อนที่เข้ากับคุณ
                        </p>
                    )}
                    {studentInterests.map((interest: any) => (
                        <span key={interest.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {interest.icon} {interest.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recommended People */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="sparkles" className="h-5 w-5 text-primary" />เพื่อนที่แนะนำ</h2>
                        <Link href="/matches" className="text-sm text-primary hover:underline">ดูทั้งหมด →</Link>
                    </div>
                    <div className="space-y-3">
                        {topMatches.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                ยังไม่มีคนที่เข้ากับคุณ ลองเพิ่มความสนใจในโปรไฟล์
                            </p>
                        )}
                        {topMatches.map((item: any) => (
                            <Link
                                key={item.studentId}
                                href={`/profile/${item.studentId}`}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                    {getInitials(item.studentName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.studentName}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.studentProgram} · ปี {item.studentYear}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-primary tabular-nums">{item.matchPercentage}%</span>
                                    <p className="text-xs text-muted-foreground">สนใจร่วมกัน {item.commonInterests.length}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Upcoming Activities */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="target" className="h-5 w-5 text-primary" />กิจกรรมที่กำลังจะมาถึง</h2>
                        <Link href="/activities" className="text-sm text-primary hover:underline">ดูทั้งหมด →</Link>
                    </div>
                    <div className="space-y-3">
                        {upcomingActivities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
                        ) : (
                            upcomingActivities.map((activity: any) => (
                                <Link
                                    key={activity.id}
                                    href={`/activities/${activity.id}`}
                                    className="block p-3 rounded-xl hover:bg-accent transition-colors"
                                >
                                    <p className="text-sm font-medium">{activity.title}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Icon name="calendar" className="h-3.5 w-3.5" />{activity.date}</span>
                                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Icon name="pin" className="h-3.5 w-3.5" />{activity.location}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 bg-muted rounded-full h-1.5">
                                            <div
                                                className="gradient-primary rounded-full h-1.5 transition-all"
                                                style={{ width: `${(activity.participants.length / activity.capacity) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {activity.participants.length}/{activity.capacity}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recommended Groups */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="users" className="h-5 w-5 text-primary" />กลุ่มที่แนะนำ</h2>
                    <Link href="/groups" className="text-sm text-primary hover:underline">ดูทั้งหมด →</Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendedGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-full">ยังไม่มีกลุ่มที่ตรงกับความสนใจของคุณ</p>
                    ) : (
                        recommendedGroups.map((group: any) => (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="p-4 rounded-xl border border-border hover:shadow-md transition-all transition-shadow hover:shadow-md"
                            >
                                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white mb-3">
                                    <Icon name="users" />
                                </div>
                                <h3 className="font-medium text-sm">{group.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                                <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1"><Icon name="user" className="h-3.5 w-3.5" />สมาชิก {group.members.length} คน</p>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
