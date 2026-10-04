"use client";

import { useState, useMemo } from "react";
import { GroupData } from "@/lib/data/groups";
import { StudentData } from "@/lib/data/students";
import { InterestWithCategory } from "@/lib/data/interests";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@/components/Icon";

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
                <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="users" className="h-6 w-6" /> กลุ่ม</h1>
                <p className="text-muted-foreground mt-1">จัดการกลุ่มทั้งหมด ({allGroups.length} กลุ่ม)</p>
            </div>

            <input type="text" placeholder="ค้นหากลุ่ม..." aria-label="ค้นหากลุ่ม" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-accent/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">กลุ่ม</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">ความสนใจ</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">ผู้สร้าง</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">สมาชิก</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">วันที่สร้าง</th>
                                <th className="px-4 py-3"><span className="sr-only">จัดการ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((group) => {
                                const creator = allStudents.find(s => s.id === group.creatorId);
                                const interests = allInterests.filter(i => group.interests.some(gi => gi.interestId === i.id));
                                return (
                                    <tr key={group.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/groups/${group.id}`} className="font-medium hover:text-primary rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{group.name}</Link>
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
                                        <td className="px-4 py-3 text-center font-semibold tabular-nums">{group.members.length}</td>
                                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{group.createdAt ? formatDate(group.createdAt) : "-"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/groups/${group.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">จัดการ <Icon name="chevron-right" className="h-3.5 w-3.5" /></Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                        ยังไม่มีกลุ่ม หรือไม่พบกลุ่มที่ตรงกับคำค้นหา
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
