"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { InterestWithCategory, LookingForOptionData } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { getInitials } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { ChatButton } from "@/components/ChatButton";

interface StudentDetailClientProps {
    student: StudentData | null;
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
    lookingForOptions: LookingForOptionData[];
}

export function StudentDetailClient({
    student,
    allStudents,
    allInterests,
    lookingForOptions,
}: StudentDetailClientProps) {
    const { user } = useAuth();

    const currentStudent = useMemo(() => {
        if (!user?.studentId) return null;
        return allStudents.find((s) => s.studentId === String(user.studentId) || s.id === String(user.studentId)) || null;
    }, [user, allStudents]);

    const studentInterests = useMemo(
        () => (student ? allInterests.filter((i) => student.interestIds.includes(i.id)) : []),
        [student, allInterests],
    );
    const studentLookingFor = student ? lookingForOptions.filter((lf) => student.lookingForIds.includes(lf.id)) : [];

    // Common interests with current user
    const commonInterests = useMemo(() => {
        if (!currentStudent || !student || currentStudent.id === student.id) return [];
        const mySet = new Set(currentStudent.interestIds);
        return studentInterests.filter((i) => mySet.has(i.id));
    }, [currentStudent, studentInterests, student]);

    const matchPercentage = useMemo(() => {
        if (!currentStudent || !student || currentStudent.id === student.id) return 0;
        const union = new Set([...currentStudent.interestIds, ...student.interestIds]).size;
        return union > 0 ? Math.round((commonInterests.length / union) * 100) : 0;
    }, [currentStudent, student, commonInterests]);

    if (!student) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <span className="flex justify-center mb-4"><Icon name="search" className="h-10 w-10" /></span>
                <p className="text-lg font-semibold">ไม่พบนักศึกษา</p>
                <Link href="/discover" className="mt-4 inline-flex items-center gap-1 text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Icon name="arrow-left" className="h-4 w-4" /> กลับไปค้นหา
                </Link>
            </div>
        );
    }

    const isOwnProfile = currentStudent?.id === student.id;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back Button */}
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Icon name="arrow-left" className="h-4 w-4" /> กลับ
            </Link>

            {/* Profile Card */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="brand-gradient h-28" />
                <div className="p-6 -mt-10">
                    <div className="flex items-end gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-card shadow-lg flex items-center justify-center text-xl font-bold gradient-primary text-white border-4 border-white">
                            {getInitials(student.name)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">{student.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                {student.faculty} · {student.program} · ปี {student.year} · รหัส {student.studentId}
                            </p>
                        </div>
                        {!isOwnProfile && matchPercentage > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary tabular-nums">{matchPercentage}%</div>
                                <p className="text-xs text-muted-foreground">ความเข้ากัน</p>
                            </div>
                        )}
                        {!isOwnProfile && currentStudent && <ChatButton studentId={student.id} />}
                    </div>
                </div>
            </div>

            {/* Bio */}
            {student.bio && (
                <div className="bg-card rounded-xl border border-border p-5">
                    <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Icon name="edit" className="h-4 w-4" /> แนะนำตัว</h2>
                    <p className="text-sm text-muted-foreground">{student.bio}</p>
                </div>
            )}

            {/* Common Interests (only when viewing another student) */}
            {!isOwnProfile && commonInterests.length > 0 && (
                <div className="bg-primary/5 rounded-xl border border-primary/20 p-5">
                    <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5 tabular-nums">
                        <Icon name="heart" className="h-4 w-4" /> ความสนใจร่วมกัน ({commonInterests.length} อย่าง)
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {commonInterests.map((interest) => (
                            <span
                                key={interest.id}
                                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                            >
                                {interest.icon} {interest.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* All Interests */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5 tabular-nums"><Icon name="sparkles" className="h-4 w-4" /> ความสนใจ ({studentInterests.length})</h2>
                {studentInterests.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">ยังไม่ได้เลือกความสนใจ</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {studentInterests.map((interest) => {
                            const isCommon = commonInterests.some((ci) => ci.id === interest.id);
                            return (
                                <span
                                    key={interest.id}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${isCommon
                                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                        : "bg-accent"
                                        }`}
                                >
                                    {interest.icon} {interest.name}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Looking For */}
            {studentLookingFor.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-5">
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Icon name="target" className="h-4 w-4" /> กำลังมองหา</h2>
                    <div className="flex flex-wrap gap-2">
                        {studentLookingFor.map((lf) => (
                            <span
                                key={lf.id}
                                className="px-3 py-1.5 rounded-full bg-accent text-sm font-medium"
                            >
                                {lf.icon} {lf.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
