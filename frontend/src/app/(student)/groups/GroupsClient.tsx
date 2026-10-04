"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { StudentData } from "@/lib/data/students";
import { GroupData } from "@/lib/data/groups";
import { InterestWithCategory } from "@/lib/data/interests";
import { joinGroup, leaveGroup } from "@/lib/actions";
import Link from "next/link";
import { Icon } from "@/components/Icon";

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
        const result = isMember
            ? await leaveGroup(currentStudent.id, groupId)
            : await joinGroup(currentStudent.id, groupId);
        if (!result.success) alert(result.error);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold inline-flex items-center gap-2"><Icon name="users" className="h-6 w-6 text-primary" /> กลุ่ม</h1>
                    <p className="text-muted-foreground mt-1">เข้าร่วมกลุ่มที่คุณสนใจ</p>
                </div>
                <Link href="/groups/create"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 shadow-md shadow-primary/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <Icon name="plus" className="h-4 w-4" /> สร้างกลุ่มใหม่
                </Link>
            </div>

            <input
                type="text"
                placeholder="ค้นหากลุ่ม..."
                aria-label="ค้นหากลุ่ม"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                    const isMember = currentStudent ? group.members.some(m => m.studentId === currentStudent.id) : false;
                    const interests = allInterests.filter(i => group.interests.some(gi => gi.interestId === i.id));
                    return (
                        <div key={group.id} className="bg-card rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-md">
                            <div className="brand-gradient h-24 flex items-center justify-center">
                                <Icon name="users" className="h-10 w-10 text-white" />
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
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums"><Icon name="user" className="h-4 w-4" /> {group.members.length} สมาชิก</span>
                                    {currentStudent?.id === group.creatorId ? (
                                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary"><Icon name="star" className="h-3.5 w-3.5" /> คุณเป็นผู้สร้าง</span>
                                    ) : (
                                    <button
                                        onClick={() => handleJoinLeave(group.id, isMember)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isMember
                                            ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            : "bg-primary text-white hover:bg-primary/90"
                                            }`}
                                    >
                                        {isMember ? "ออกจากกลุ่ม" : "เข้าร่วม"}
                                    </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredGroups.length === 0 && (
                <div className="text-center py-16">
                    <Icon name="search" className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-3">
                        {search
                            ? "ไม่พบกลุ่มที่ตรงกับคำค้นหา ลองใช้คำอื่น หรือสร้างกลุ่มใหม่ดูสิ"
                            : "ยังไม่มีกลุ่ม มาสร้างกลุ่มแรกเพื่อชวนเพื่อนที่สนใจเรื่องเดียวกันกันเถอะ"}
                    </p>
                </div>
            )}
        </div>
    );
}
