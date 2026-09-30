"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/lib/auth-context";
import { StudentData } from "@/lib/data/students";
import { GroupData } from "@/lib/data/groups";
import { InterestWithCategory } from "@/lib/data/interests";
import { joinGroup, leaveGroup } from "@/lib/actions";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface GroupClientProps {
    group: GroupData;
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
}

export function GroupDetailClient({ group, allStudents, allInterests }: GroupClientProps) {
    const { user } = useAuth();
    const [isPending, startTransition] = useTransition();
    const currentStudent = user?.studentId ? allStudents.find(s => s.id === user.studentId) : null;

    if (!group) {
        return (
            <div className="text-center py-20">
                <span className="text-4xl">😔</span>
                <p className="text-muted-foreground mt-3">ไม่พบ Group</p>
                <Link href="/groups" className="mt-3 inline-block text-sm text-primary hover:underline">กลับ →</Link>
            </div>
        );
    }

    const interests = allInterests.filter(i => group.interests.some(gi => gi.interestId === i.id));
    const isMember = currentStudent ? group.members.some(m => m.studentId === currentStudent.id) : false;
    const isCreator = currentStudent?.id === group.creatorId;

    const handleJoinLeave = async () => {
        if (!currentStudent) return;
        startTransition(async () => {
            if (isMember) {
                await leaveGroup(currentStudent.id, group.id);
            } else {
                await joinGroup(currentStudent.id, group.id);
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                ← กลับไปหน้า Groups
            </Link>

            {/* Header */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-36 flex items-center justify-center">
                    <span className="text-5xl">👥</span>
                </div>
                <div className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{group.name}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span>👤 {group.members.length} members</span>
                                <span>📅 Created {group.createdAt}</span>
                            </div>
                        </div>
                        {!isCreator && (
                            <button
                                onClick={handleJoinLeave}
                                disabled={isPending}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isMember
                                    ? "bg-muted hover:bg-destructive/10 hover:text-destructive"
                                    : "gradient-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
                                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {isPending ? "กำลังอัปเดต..." : isMember ? "ออกจากกลุ่ม" : "เข้าร่วมกลุ่ม"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Interests */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-3">Related Interests</h2>
                <div className="flex flex-wrap gap-2">
                    {interests.map((i) => (
                        <span key={i.id} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                            {i.icon} {i.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Members */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Members ({group.members.length})</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    {group.members.map((memberWrap) => {
                        const member = allStudents.find(s => s.id === memberWrap.studentId);
                        if (!member) return null;
                        return (
                            <Link
                                key={member.id}
                                href={`/profile/${member.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                    {getInitials(member.name)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {member.name}
                                        {member.id === group.creatorId && (
                                            <span className="ml-1.5 text-xs text-primary">👑 Creator</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">Year {member.year}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
