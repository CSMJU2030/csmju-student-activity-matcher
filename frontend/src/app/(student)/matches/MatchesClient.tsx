"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
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
                <p className="text-4xl mb-4">🔒</p>
                <p className="text-lg font-semibold">กรุณา Login ก่อน</p>
            </div>
        );
    }

    if (currentStudent.interestIds.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <p className="text-4xl mb-4">✨</p>
                <p className="text-lg font-semibold">ยังไม่มี Interest</p>
                <p className="text-sm mt-1">กรุณาเพิ่ม Interest ใน Profile ก่อน</p>
                <Link href="/profile" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-xl font-medium">
                    ไปที่ Profile
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">❤️ Matches</h1>
                <p className="text-muted-foreground mt-1">
                    เจอคนที่มีความสนใจเหมือนกัน {matches.length} คน
                </p>
            </div>

            {matches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-4xl mb-4">😔</p>
                    <p className="text-lg font-semibold">ยังไม่พบ Match</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {matches.map(({ student, commonInterests, matchPercentage }) => (
                        <Link
                            key={student.id}
                            href={`/students/${student.id}`}
                            className="bg-card rounded-xl border border-border p-5 card-hover flex items-center gap-5"
                        >
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                                    {getInitials(student.name)}
                                </div>
                                <div className="absolute -top-1 -right-1 text-xs font-bold bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center shadow">
                                    {matchPercentage}%
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{student.name}</h3>
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
                            <div className="hidden sm:flex items-center text-xs text-muted-foreground">
                                ❤️ {commonInterests.length} ร่วม
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
