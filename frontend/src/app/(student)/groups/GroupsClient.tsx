"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { StudentData } from "@/lib/data/students";
import { GroupData } from "@/lib/data/groups";
import { InterestWithCategory } from "@/lib/data/interests";
import { joinGroup, leaveGroup } from "@/lib/actions";
import Link from "next/link";

interface GroupsClientProps {
    allStudents: StudentData[];
    allGroups: GroupData[];
    allInterests: InterestWithCategory[];
}

export function GroupsClient({ allStudents, allGroups, allInterests }: GroupsClientProps) {
    const { user } = useAuth();
    const currentStudent = user?.studentId ? allStudents.find(s => s.id === user.studentId) : null;
    const [search, setSearch] = useState("");

    const filteredGroups = useMemo(() => {
        if (!search) return allGroups;
        const q = search.toLowerCase();
        return allGroups.filter((g) =>
            g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
        );
    }, [allGroups, search]);

    const handleJoinLeave = async (groupId: string, isMember: boolean) => {
        if (!currentStudent) { alert("กรุณาเข้าสู่ระบบก่อน"); return; }
        if (isMember) {
            await leaveGroup(currentStudent.id, groupId);
        } else {
            await joinGroup(currentStudent.id, groupId);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">👥 Groups</h1>
                    <p className="text-muted-foreground mt-1">เข้าร่วมกลุ่มที่คุณสนใจ</p>
                </div>
                <Link href="/groups/create"
                    className="px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 shadow-md shadow-primary/20 transition-all"
                >
                    ✨ สร้าง Group ใหม่
                </Link>
            </div>

            <input
                type="text"
                placeholder="ค้นหา Group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                    const isMember = currentStudent ? group.members.some(m => m.studentId === currentStudent.id) : false;
                    const interests = allInterests.filter(i => group.interests.some(gi => gi.interestId === i.id));
                    return (
                        <div key={group.id} className="bg-card rounded-xl border border-border overflow-hidden card-hover">
                            <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-24 flex items-center justify-center">
                                <span className="text-4xl">👥</span>
                            </div>
                            <div className="p-5">
                                <div className="font-semibold text-lg">{group.name}</div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {interests.map((i) => (
                                        <span key={i.id} className="text-xs px-2 py-0.5 rounded-full bg-accent">
                                            {i.icon} {i.name}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                                    <span className="text-xs text-muted-foreground">👤 {group.members.length} members</span>
                                    <button
                                        onClick={() => handleJoinLeave(group.id, isMember)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isMember
                                            ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            : "bg-primary text-white hover:bg-primary/90"
                                            }`}
                                    >
                                        {isMember ? "ออกจากกลุ่ม" : "เข้าร่วม"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredGroups.length === 0 && (
                <div className="text-center py-16">
                    <span className="text-4xl">📭</span>
                    <p className="text-muted-foreground mt-3">ไม่พบ Group ที่ตรงกับการค้นหา</p>
                </div>
            )}
        </div>
    );
}
