"use client";

import { useState, useMemo } from "react";
import { GroupData } from "@/lib/data/groups";
import { StudentData } from "@/lib/data/students";
import { InterestWithCategory } from "@/lib/data/interests";
import { formatDate } from "@/lib/utils";

interface AdminGroupsProps {
    allStudents: StudentData[];
    allGroups: GroupData[];
    allInterests: InterestWithCategory[];
}

export function AdminGroupsClient({ allStudents, allGroups, allInterests }: AdminGroupsProps) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search) return allGroups;
        const q = search.toLowerCase();
        return allGroups.filter((g) => g.name.toLowerCase().includes(q));
    }, [allGroups, search]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">👥 Groups</h1>
                <p className="text-muted-foreground mt-1">จัดการกลุ่มทั้งหมด ({allGroups.length} กลุ่ม)</p>
            </div>

            <input type="text" placeholder="ค้นหา Group..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-accent/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Interests</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Creator</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Members</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((group) => {
                                const creator = allStudents.find(s => s.id === group.creatorId);
                                const interests = allInterests.filter(i => group.interests.some(gi => gi.interestId === i.id));
                                return (
                                    <tr key={group.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{group.name}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {interests.map((i) => (
                                                    <span key={i.id} className="text-xs px-2 py-0.5 rounded-full bg-accent">{i.icon} {i.name}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{creator?.name || "-"}</td>
                                        <td className="px-4 py-3 text-center font-semibold">{group.members.length}</td>
                                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{group.createdAt ? formatDate(group.createdAt) : "-"}</td>
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
