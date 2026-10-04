"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    addInterestToStudent,
    removeInterestFromStudent,
    createCustomInterest,
    toggleLookingFor,
    updateBio,
} from "@/lib/actions";
import { InterestWithCategory, InterestCategoryData, LookingForOptionData } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { InterestPicker } from "@/components/InterestPicker";
import { ChatButton } from "@/components/ChatButton";
import { useRouter } from "next/navigation";

interface ProfileClientProps {
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
    allCategories: InterestCategoryData[];
    lookingForOptions: LookingForOptionData[];
}

export function ProfileClient({
    allStudents,
    allInterests,
    allCategories,
    lookingForOptions,
}: ProfileClientProps) {
    const { user } = useAuth();
    const router = useRouter();

    const student = useMemo(() => {
        if (!user?.studentId) return null;
        return allStudents.find((s) => s.studentId === String(user.studentId) || s.id === String(user.studentId)) || null;
    }, [user, allStudents]);

    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState(student?.bio || "");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [localInterestIds, setLocalInterestIds] = useState<string[]>(student?.interestIds || []);
    const [localLookingForIds, setLocalLookingForIds] = useState<string[]>(student?.lookingForIds || []);

    type MatchUser = { id: string; name: string; studentId: string };
    const [matchModalData, setMatchModalData] = useState<{ interestName: string; users: MatchUser[] } | null>(null);

    const showSuccess = useCallback((msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 3000);
    }, []);

    if (!student) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <span className="flex justify-center mb-4"><Icon name="user" className="h-10 w-10" /></span>
                <p className="text-lg font-semibold">ไม่พบข้อมูลโปรไฟล์</p>
                <p className="text-sm mt-2">กรุณาเข้าสู่ระบบใหม่อีกครั้ง</p>
            </div>
        );
    }

    const myInterests = allInterests.filter((i) => localInterestIds.includes(i.id));
    const myLookingFor = lookingForOptions.filter((lf) => localLookingForIds.includes(lf.id));

    const handleAddInterest = async (interestId: string) => {
        setLoading(true);
        setLocalInterestIds((prev) => [...prev, interestId]);
        const result = await addInterestToStudent(student.id, interestId);
        if (result.success) {
            const addedInterest = allInterests.find(i => i.id === interestId);
            if (result.matchedStudents && result.matchedStudents.length > 0) {
                setMatchModalData({ interestName: addedInterest?.name || "ความสนใจใหม่", users: result.matchedStudents });
            } else {
                showSuccess("เพิ่มความสนใจสำเร็จ");
            }
            router.refresh();
        } else {
            setLocalInterestIds((prev) => prev.filter((id) => id !== interestId));
        }
        setLoading(false);
    };

    const handleRemoveInterest = async (interestId: string) => {
        setLoading(true);
        setLocalInterestIds((prev) => prev.filter((id) => id !== interestId));
        const result = await removeInterestFromStudent(student.id, interestId);
        if (result.success) {
            showSuccess("ลบความสนใจสำเร็จ");
            router.refresh();
        } else {
            setLocalInterestIds((prev) => [...prev, interestId]);
        }
        setLoading(false);
    };

    const handleCreateCustomInterest = async (name: string, categoryId: string) => {
        setLoading(true);
        const result = await createCustomInterest(student.id, name, categoryId);
        if (result.success) {
            // Show it right away, before the refreshed interest list arrives.
            if (result.interestId) {
                const newId = result.interestId;
                setLocalInterestIds((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
            }
            if (result.matchedStudents && result.matchedStudents.length > 0) {
                setMatchModalData({ interestName: name, users: result.matchedStudents });
            } else {
                showSuccess(`เพิ่ม "${name}" สำเร็จ`);
            }
            router.refresh();
        } else {
            showSuccess(result.error || "ไม่สามารถสร้างได้");
        }
        setLoading(false);
    };

    const handleToggleLookingFor = async (lfId: string) => {
        setLoading(true);
        const wasSelected = localLookingForIds.includes(lfId);
        setLocalLookingForIds((prev) =>
            wasSelected ? prev.filter((id) => id !== lfId) : [...prev, lfId]
        );
        const result = await toggleLookingFor(student.id, lfId);
        if (result.success) {
            showSuccess(wasSelected ? "ลบสิ่งที่กำลังหาสำเร็จ" : "เพิ่มสิ่งที่กำลังหาสำเร็จ");
            router.refresh();
        } else {
            setLocalLookingForIds((prev) =>
                wasSelected ? [...prev, lfId] : prev.filter((id) => id !== lfId)
            );
        }
        setLoading(false);
    };

    const handleSaveBio = async () => {
        setLoading(true);
        const result = await updateBio(student.id, editBio);
        if (result.success) {
            setIsEditing(false);
            showSuccess("บันทึกคำแนะนำตัวสำเร็จ");
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {successMsg && (
                <div className="fixed top-4 right-4 lg:top-8 lg:right-8 bg-primary/10 text-primary border border-primary/20 px-4 py-3 rounded-xl shadow-lg z-50 animate-in slide-in-from-top flex items-center gap-2" role="status">
                    <Icon name="check" className="h-5 w-5 shrink-0" /> {successMsg}
                </div>
            )}

            {/* Profile Header */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="brand-gradient h-32" />
                <div className="p-4 sm:p-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card shadow-lg flex shrink-0 items-center justify-center text-4xl font-bold gradient-primary text-white border-4 border-white -mt-16 z-10">
                            {getInitials(student.name)}
                        </div>
                        <div className="flex-1 mt-2 sm:mt-0 pb-1">
                            <h1 className="text-2xl font-bold leading-normal pt-1">{student.name}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {student.faculty} · {student.program} · ปี {student.year}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">รหัส: {student.studentId}</p>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:pb-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-4 py-2 w-full sm:w-auto rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isEditing ? "bg-muted text-muted-foreground" : "bg-primary text-white hover:bg-primary/90"}`}
                            >
                                <Icon name={isEditing ? "x" : "edit"} className="h-4 w-4" />
                                {isEditing ? "ปิดแผงแก้ไข" : "แก้ไขโปรไฟล์"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Official Student Info (read-only) */}
            <div className="bg-background/50 rounded-xl border border-border p-6">
                <h2 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-1.5">
                    <Icon name="info" className="h-4 w-4" /> ข้อมูลนักศึกษา (จากระบบทะเบียน)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">รหัสนักศึกษา</p>
                        <p className="text-sm font-medium text-foreground">{student.studentId}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">ชื่อ</p>
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">คณะ</p>
                        <p className="text-sm font-medium text-foreground">{student.faculty}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">สาขา</p>
                        <p className="text-sm font-medium text-foreground">{student.program}</p>
                    </div>
                </div>
                <p className="text-xs text-outline mt-3 italic">ข้อมูลส่วนนี้มาจากระบบทะเบียน ไม่สามารถแก้ไขได้</p>
            </div>

            {/* Bio */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Icon name="edit" className="h-5 w-5" /> แนะนำตัว</h2>
                {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            rows={3}
                            maxLength={500}
                            className="w-full px-4 py-3 rounded-xl border border-input bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                            aria-label="แนะนำตัว"
                            placeholder="เขียนแนะนำตัวเอง..."
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground tabular-nums">{editBio.length}/500</span>
                            <button
                                onClick={handleSaveBio}
                                disabled={loading}
                                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{student.bio || "ยังไม่ได้แนะนำตัว"}</p>
                )}
            </div>

            {/* Interests */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 tabular-nums"><Icon name="sparkles" className="h-5 w-5" /> ความสนใจ ({localInterestIds.length})</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                    {myInterests.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">ยังไม่ได้เลือกความสนใจ — กดแก้ไขโปรไฟล์เพื่อเพิ่มได้เลย</p>
                    ) : (
                        myInterests.map((interest) => (
                            <span
                                key={interest.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                            >
                                {interest.icon} {interest.name}
                                {isEditing && (
                                    <button
                                        onClick={() => handleRemoveInterest(interest.id)}
                                        disabled={loading}
                                        aria-label={`ลบ ${interest.name}`}
                                        className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full hover:text-destructive ${"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"}`}
                                    >
                                        <Icon name="x" className="h-4 w-4" />
                                    </button>
                                )}
                            </span>
                        ))
                    )}
                </div>

                {isEditing && (
                    <div className="border-t border-border pt-4 space-y-3">
                        <p className="text-sm font-medium">เพิ่มความสนใจ</p>
                        <InterestPicker
                            allInterests={allInterests}
                            categories={allCategories}
                            selectedIds={localInterestIds}
                            disabled={loading}
                            onAdd={handleAddInterest}
                            onCreate={handleCreateCustomInterest}
                        />
                    </div>
                )}
            </div>

            {/* Looking For */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon name="target" className="h-5 w-5" /> กำลังมองหา</h2>
                <div className="flex flex-wrap gap-2">
                    {lookingForOptions.map((lf) => {
                        const isSelected = localLookingForIds.includes(lf.id);
                        return (
                            <button
                                key={lf.id}
                                onClick={() => handleToggleLookingFor(lf.id)}
                                disabled={loading}
                                aria-pressed={isSelected}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSelected
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "bg-accent hover:bg-accent/80 text-muted-foreground cursor-pointer"
                                    }`}
                            >
                                {lf.icon} {lf.label}
                            </button>
                        );
                    })}
                </div>
                {myLookingFor.length === 0 && (
                    <p className="text-sm text-muted-foreground italic mt-2">ยังไม่ได้เลือก — กดเลือกด้านบนได้เลย</p>
                )}
            </div>

            {/* Match Modal (Tinder Style) */}
            {matchModalData && matchModalData.users.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative max-w-sm w-full mx-4 p-8 brand-gradient rounded-3xl border border-white/20 text-center space-y-6">
                        <h2 className="text-4xl font-bold text-white">
                            จับคู่สำเร็จ!
                        </h2>
                        <p className="text-white text-lg">
                            คุณและ <strong>{matchModalData.users[0].name}</strong> สนใจ <br />
                            <span className="text-primary-fixed font-bold text-2xl">{matchModalData.interestName}</span> <br />
                            เหมือนกัน!
                        </p>

                        <div className="flex justify-center items-center gap-4">
                            <div className="w-20 h-20 rounded-full gradient-primary border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-lg z-10 shrink-0">
                                {getInitials(student.name)}
                            </div>
                            <div className="w-10 h-10 -mx-6 bg-card rounded-full flex items-center justify-center z-20 shadow-lg text-primary font-bold text-xl">
                                <Icon name="star" className="h-6 w-6" />
                            </div>
                            <div className="w-20 h-20 rounded-full gradient-primary border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-lg z-10 shrink-0">
                                {getInitials(matchModalData.users[0].name)}
                            </div>
                        </div>

                        {matchModalData.users.length > 1 && (
                            <p className="text-white/70 text-sm">และเพื่อนอีก {matchModalData.users.length - 1} คน</p>
                        )}

                        <div className="pt-4 space-y-3">
                            <ChatButton
                                studentId={matchModalData.users[0].id}
                                label={`ทักแชท ${matchModalData.users[0].name.split(" ")[0]}`}
                                className="w-full py-3 rounded-full text-base"
                            />
                            <button
                                onClick={() => setMatchModalData(null)}
                                className="w-full py-3 px-6 rounded-full bg-card text-primary font-bold text-lg hover:scale-105 transition-transform shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                ดำเนินการต่อ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
