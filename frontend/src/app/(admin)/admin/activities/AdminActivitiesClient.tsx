"use client";

import { useState, useMemo } from "react";
import { ActivityData } from "@/lib/data/activities";
import { StudentData } from "@/lib/data/students";
import { InterestWithCategory } from "@/lib/data/interests";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

interface AdminActivitiesProps {
    allStudents: StudentData[];
    allActivities: ActivityData[];
    allInterests: InterestWithCategory[];
}

export function AdminActivitiesClient({ allStudents, allActivities, allInterests }: AdminActivitiesProps) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search) return allActivities;
        const q = search.toLowerCase();
        return allActivities.filter((a) => a.title.toLowerCase().includes(q));
    }, [allActivities, search]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">🎯 Activities</h1>
                <p className="text-muted-foreground mt-1">จัดการกิจกรรมทั้งหมด ({allActivities.length} กิจกรรม)</p>
            </div>

            <input type="text" placeholder="ค้นหา Activity..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-accent/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Activity</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date & Time</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Participants</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Creator</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((activity) => {
                                const creator = allStudents.find(s => s.id === activity.creatorId);
                                const interests = allInterests.filter(i => activity.interests.some(ai => ai.interestId === i.id));
                                const fillPercent = (activity.participants.length / activity.capacity) * 100;
                                return (
                                    <tr key={activity.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/activities/${activity.id}`} className="font-medium hover:text-primary">{activity.title}</Link>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {interests.map((i) => (
                                                    <span key={i.id} className="text-xs px-2 py-0.5 rounded-full bg-accent">{i.icon} {i.name}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                            <p>{formatDate(activity.date)}</p>
                                            <p className="text-xs">{formatTime(activity.time)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{activity.location}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-center">
                                                <p className="font-semibold">{activity.participants.length}/{activity.capacity}</p>
                                                <div className="w-20 mx-auto bg-muted rounded-full h-1.5 mt-1">
                                                    <div
                                                        className={`rounded-full h-1.5 ${fillPercent >= 100 ? "bg-destructive" : "gradient-primary"}`}
                                                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{creator?.name || "-"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/activities/${activity.id}`} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">จัดการ →</Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
