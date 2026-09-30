"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDashboardData } from "@/lib/actions";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

export function DashboardClient({ allStudents }: { allStudents: any[] }) {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const student = useMemo(() => {
        return user?.studentId ? allStudents.find(s => s.id === user.studentId) : null;
    }, [user, allStudents]);

    useEffect(() => {
        if (student) {
            getDashboardData(student.id).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [student]);

    if (!student || loading) return <div className="text-center py-20 text-muted-foreground">Loading Profile...</div>;

    const { studentInterests, groupsCount, activitiesCount, topMatches, upcomingActivities, recommendedGroups } = data;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="gradient-primary rounded-2xl p-8 text-white shadow-lg shadow-primary/20">
                <h1 className="text-2xl lg:text-3xl font-bold">
                    Welcome back, {student.name.split(" ")[0]} 👋
                </h1>
                <p className="text-white/80 mt-2">ค้นหาเพื่อนหัววิทยาการคอมพิวเตอร์ที่มีความสนใจเหมือนกันวันนี้</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Interests", value: studentInterests.length, icon: "✨", color: "bg-purple-50 text-primary" },
                    { label: "Groups", value: groupsCount, icon: "👥", color: "bg-blue-50 text-primary" },
                    { label: "Top Matches", value: topMatches.length, icon: "💫", color: "bg-pink-50 text-primary" },
                    { label: "Activities", value: activitiesCount, icon: "🎯", color: "bg-amber-50 text-amber-600" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl border border-border p-5 card-hover">
                        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-lg mb-3`}>
                            {stat.icon}
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Your Interests */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Your Interests</h2>
                    <Link href="/profile" className="text-sm text-primary hover:underline">
                        แก้ไข →
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2">
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
                        <h2 className="text-lg font-semibold">💫 Recommended People</h2>
                        <Link href="/matches" className="text-sm text-primary hover:underline">ดูทั้งหมด →</Link>
                    </div>
                    <div className="space-y-3">
                        {topMatches.map((item: any) => (
                            <Link
                                key={item.studentId}
                                href={`/profile/${item.studentId}`}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                    {getInitials(item.studentName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.studentName}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.studentProgram} · Year {item.studentYear}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-primary">{item.matchPercentage}%</span>
                                    <p className="text-xs text-muted-foreground">{item.commonInterests.length} shared</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Upcoming Activities */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">🎯 Upcoming Activities</h2>
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
                                        <span className="text-xs text-muted-foreground">📅 {activity.date}</span>
                                        <span className="text-xs text-muted-foreground">📍 {activity.location}</span>
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
                    <h2 className="text-lg font-semibold">👥 Recommended Groups</h2>
                    <Link href="/groups" className="text-sm text-primary hover:underline">ดูทั้งหมด →</Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendedGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-full">No groups match your interests yet.</p>
                    ) : (
                        recommendedGroups.map((group: any) => (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="p-4 rounded-xl border border-border hover:shadow-md transition-all card-hover"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-lg mb-3">
                                    👥
                                </div>
                                <h3 className="font-medium text-sm">{group.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">👤 {group.members.length} members</p>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
