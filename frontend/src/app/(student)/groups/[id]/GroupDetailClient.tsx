"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/lib/auth-context";
import { StudentData } from "@/lib/data/students";
import { GroupData } from "@/lib/data/groups";
import { InterestWithCategory } from "@/lib/data/interests";
import { joinGroup, leaveGroup, deleteGroup } from "@/lib/actions";
import { getInitials, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Notice } from "@/components/Notice";
import { ConfirmButton } from "@/components/ConfirmButton";
import { useRouter } from "next/navigation";

interface GroupClientProps {
    group: GroupData;
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
}

export function GroupDetailClient({ group, allStudents, allInterests }: GroupClientProps) {
    const { user } = useAuth();
    const [isPending, startTransition] = useTransition();
    const [notice, setNotice] = useState<string | null>(null);
    const router = useRouter();
    const currentStudent = user?.studentId ? allStudents.find(s => s.id === user.studentId) : null;

    if (!group) {
        return (
            <div className="text-center py-20">
                <Icon name="info" className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-3">ไม่พบกลุ่มนี้ อาจถูกลบไปแล้ว</p>
                <Link href="/groups" className="mt-3 inline-block text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">กลับไปหน้ากลุ่ม</Link>
            </div>
        );
    }

    const interests = allInterests.filter(i => group.interests.some(gi => gi.interestId === i.id));
    const isMember = currentStudent ? group.members.some(m => m.studentId === currentStudent.id) : false;
    const isCreator = currentStudent?.id === group.creatorId;

    const handleDelete = async () => {
        const result = await deleteGroup(group.id);
        if (result.success) router.push("/groups");
        else setNotice(result.error ?? "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง");
    };

    const handleJoinLeave = async () => {
        if (!currentStudent) return;
        startTransition(async () => {
            const result = isMember
                ? await leaveGroup(currentStudent.id, group.id)
                : await joinGroup(currentStudent.id, group.id);
            if (!result.success) setNotice(result.error ?? "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง");
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Icon name="arrow-left" className="h-4 w-4" /> กลับไปหน้ากลุ่ม
            </Link>

            <Notice message={notice} onClose={() => setNotice(null)} />

            {/* Header */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="brand-gradient h-36 flex items-center justify-center">
                    <Icon name="users" className="h-12 w-12 text-white" />
                </div>
                <div className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{group.name}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1 tabular-nums"><Icon name="user" className="h-4 w-4" /> {group.members.length} สมาชิก</span>
                                <span className="inline-flex items-center gap-1"><Icon name="calendar" className="h-4 w-4" /> สร้างเมื่อ {formatDate(group.createdAt)}</span>
                            </div>
                        </div>
                        {!isCreator && (
                            <button
                                onClick={handleJoinLeave}
                                disabled={isPending}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isMember
                                    ? "bg-muted hover:bg-destructive/10 hover:text-destructive"
                                    : "gradient-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
                                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {isPending ? "กำลังอัปเดต..." : isMember ? "ออกจากกลุ่ม" : "เข้าร่วมกลุ่ม"}
                            </button>
                        )}
                        {isCreator && (
                            <div className="flex flex-col items-end gap-2">
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary"><Icon name="star" className="h-3.5 w-3.5" /> คุณเป็นผู้สร้าง</span>
                                <ConfirmButton onConfirm={handleDelete} confirmLabel="กดอีกครั้งเพื่อลบกลุ่ม"><span className="inline-flex items-center gap-1"><Icon name="trash" className="h-4 w-4" /> ลบกลุ่ม</span></ConfirmButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Interests */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-3">ความสนใจที่เกี่ยวข้อง</h2>
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
                <h2 className="text-lg font-semibold mb-4">สมาชิก <span className="tabular-nums">({group.members.length})</span></h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    {group.members.map((memberWrap) => {
                        const member = allStudents.find(s => s.id === memberWrap.studentId);
                        if (!member) return null;
                        return (
                            <Link
                                key={member.id}
                                href={`/profile/${member.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                                    {getInitials(member.name)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {member.name}
                                        {member.id === group.creatorId && (
                                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-primary"><Icon name="star" className="h-3 w-3" /> ผู้สร้าง</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">ชั้นปีที่ {member.year}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
