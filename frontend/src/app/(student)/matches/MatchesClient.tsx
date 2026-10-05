"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ChatButton } from "@/components/ChatButton";
import { InterestWithCategory } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { getInitials } from "@/lib/utils";

interface MatchesClientProps {
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
}

interface ComputedMatch {
    student: StudentData;
    commonInterests: InterestWithCategory[];
    matchPercentage: number;
}

export function MatchesClient({ allStudents, allInterests }: MatchesClientProps) {
    const { user } = useAuth();

    const currentStudent = user?.studentId
        ? allStudents.find((s) => s.id === user.studentId)
        : null;

    const matches = useMemo<ComputedMatch[]>(() => {
        if (!currentStudent || currentStudent.interestIds.length === 0) return [];

        const mySet = new Set(currentStudent.interestIds);

        return allStudents
            .filter((s) => s.id !== currentStudent.id)
            .map((s) => {
                const theirSet = new Set(s.interestIds);
                const common = [...mySet].filter((id) => theirSet.has(id));
                const union = new Set([...mySet, ...theirSet]).size;
                const matchPercentage = union > 0 ? Math.round((common.length / union) * 100) : 0;

                const commonInterests = common
                    .map((id) => allInterests.find((i) => i.id === id))
                    .filter(Boolean) as InterestWithCategory[];

                return { student: s, commonInterests, matchPercentage };
            })
            .filter((m) => m.commonInterests.length > 0)
            .sort((a, b) => b.matchPercentage - a.matchPercentage);
    }, [allStudents, currentStudent, allInterests]);

    if (!currentStudent) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <span className="flex justify-center mb-4"><Icon name="lock" className="h-10 w-10" /></span>
                <p className="text-lg font-semibold">กรุณาเข้าสู่ระบบก่อน</p>
            </div>
        );
    }

    if (currentStudent.interestIds.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <span className="flex justify-center mb-4"><Icon name="sparkles" className="h-10 w-10" /></span>
                <p className="text-lg font-semibold">ยังไม่มีความสนใจ</p>
                <p className="text-sm mt-1">เพิ่มความสนใจในโปรไฟล์ก่อน แล้วระบบจะจับคู่เพื่อนให้คุณ</p>
                <Link href="/profile" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    ไปที่โปรไฟล์
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="heart" className="h-6 w-6 text-primary" /> เพื่อนที่เข้ากัน</h1>
                <p className="text-muted-foreground mt-1">
                    เจอคนที่มีความสนใจเหมือนกัน <span className="tabular-nums">{matches.length}</span> คน
                </p>
            </div>

            {matches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <span className="flex justify-center mb-4"><Icon name="users" className="h-10 w-10" /></span>
                    <p className="text-lg font-semibold">ยังไม่พบเพื่อนที่เข้ากัน</p>
                    <p className="text-sm mt-1">ลองเพิ่มความสนใจในโปรไฟล์ให้หลากหลายขึ้น</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {matches.map(({ student, commonInterests, matchPercentage }) => (
                        <div
                            key={student.id}
                            className="bg-card rounded-xl border border-border p-5 transition-shadow hover:shadow-md flex items-center gap-5"
                        >
                            <Link href={`/students/${student.id}`} className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-lg shrink-0">
                                    {getInitials(student.name)}
                                </div>
                                <div className="absolute -top-1 -right-1 text-xs font-bold bg-primary text-white rounded-full min-w-7 h-7 px-1 tabular-nums flex items-center justify-center shadow">
                                    {matchPercentage}%
                                </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link href={`/students/${student.id}`} className="font-semibold hover:text-primary rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{student.name}</Link>
                                <p className="text-xs text-muted-foreground">{student.faculty} · {student.program}</p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {commonInterests.slice(0, 5).map((interest) => (
                                        <span
                                            key={interest.id}
                                            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                                        >
                                            {interest.icon} {interest.name}
                                        </span>
                                    ))}
                                    {commonInterests.length > 5 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                                            +{commonInterests.length - 5}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums"><Icon name="heart" className="h-4 w-4" /> สนใจร่วมกัน {commonInterests.length}</span>
                                <ChatButton studentId={student.id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
