"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    addInterestToStudent,
    adminUpdateStudent,
    createCustomInterest,
    removeInterestFromStudent,
    toggleLookingFor,
} from "@/lib/actions";
import { InterestCategoryData, InterestWithCategory, LookingForOptionData } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { formatDate, getInitials } from "@/lib/utils";
import { InterestPicker } from "@/components/InterestPicker";
import { GroupData } from "@/lib/data/groups";
import { ActivityData } from "@/lib/data/activities";


interface Props {
    student: StudentData;
    allInterests: InterestWithCategory[];
    categories: InterestCategoryData[];
    lookingForOptions: LookingForOptionData[];
    groups: GroupData[];
    activities: ActivityData[];
}

const SOURCE_LABEL: Record<string, string> = {
    REG: "ข้อมูลจาก REG",
    ADMIN: "แก้ไขโดยแอดมิน (Sync REG จะไม่เขียนทับ)",
    SEED: "ข้อมูลตัวอย่าง",
};

export function AdminStudentEditor({ student, allInterests, categories, lookingForOptions, groups, activities }: Props) {
    const router = useRouter();
    const [form, setForm] = useState({
        name: student.name,
        faculty: student.faculty,
        program: student.program,
        year: String(student.year),
        bio: student.bio ?? "",
    });
    const [interestIds, setInterestIds] = useState(student.interestIds);
    const [lookingForIds, setLookingForIds] = useState(student.lookingForIds);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const flash = (ok: boolean, text: string) => {
        setMsg({ ok, text });
        setTimeout(() => setMsg(null), 3500);
    };

    const dirty =
        form.name !== student.name ||
        form.faculty !== student.faculty ||
        form.program !== student.program ||
        form.year !== String(student.year) ||
        form.bio !== (student.bio ?? "");

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        const res = await adminUpdateStudent(student.id, {
            name: form.name,
            faculty: form.faculty,
            program: form.program,
            year: Number(form.year),
            bio: form.bio,
        });
        setBusy(false);
        if (res.success) {
            flash(true, "✅ บันทึกข้อมูลแล้ว");
            router.refresh();
        } else {
            flash(false, res.error || "บันทึกไม่สำเร็จ");
        }
    };

    const addInterest = async (id: string) => {
        setBusy(true);
        setInterestIds((prev) => [...prev, id]);
        const res = await addInterestToStudent(student.id, id);
        if (!res.success) {
            setInterestIds((prev) => prev.filter((x) => x !== id));
            flash(false, res.error || "เพิ่มไม่สำเร็จ");
        }
        setBusy(false);
    };

    const removeInterest = async (id: string) => {
        setBusy(true);
        setInterestIds((prev) => prev.filter((x) => x !== id));
        const res = await removeInterestFromStudent(student.id, id);
        if (!res.success) {
            setInterestIds((prev) => [...prev, id]);
            flash(false, res.error || "ลบไม่สำเร็จ");
        }
        setBusy(false);
    };

    const createInterest = async (name: string, categoryId: string) => {
        setBusy(true);
        const res = await createCustomInterest(student.id, name, categoryId);
        if (res.success && res.interestId) {
            setInterestIds((prev) => (prev.includes(res.interestId!) ? prev : [...prev, res.interestId!]));
            flash(true, `✅ เพิ่ม "${name}" แล้ว`);
            router.refresh();
        } else {
            flash(false, res.error || "เพิ่มไม่สำเร็จ");
        }
        setBusy(false);
    };

    const toggleLf = async (id: string) => {
        setBusy(true);
        const had = lookingForIds.includes(id);
        setLookingForIds((prev) => (had ? prev.filter((x) => x !== id) : [...prev, id]));
        const res = await toggleLookingFor(student.id, id);
        if (!res.success) {
            setLookingForIds((prev) => (had ? [...prev, id] : prev.filter((x) => x !== id)));
            flash(false, res.error || "บันทึกไม่สำเร็จ");
        }
        setBusy(false);
    };

    // Includes interests created a moment ago (before the refreshed list arrives).
    const selected = interestIds
        .map((id) => allInterests.find((i) => i.id === id))
        .filter((i): i is InterestWithCategory => !!i);

    const input = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/admin/students" className="text-sm text-muted-foreground hover:text-primary">← กลับไปรายชื่อนักศึกษา</Link>

            <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {getInitials(student.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate">{student.name}</h1>
                    <p className="text-sm text-muted-foreground">รหัส {student.studentId} · ชั้นปี {student.year}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-primary">
                    {SOURCE_LABEL[student.dataSource] ?? student.dataSource}
                </span>
            </div>

            {msg && (
                <div className={`p-3 rounded-lg text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                    {msg.text}
                </div>
            )}

            {/* Basic info */}
            <form onSubmit={save} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">📝 ข้อมูลพื้นฐาน</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <label className="space-y-1 sm:col-span-2">
                        <span className="text-sm font-medium">ชื่อ-นามสกุล</span>
                        <input className={input} value={form.name} minLength={2} maxLength={120} required
                            onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium">คณะ</span>
                        <input className={input} value={form.faculty} maxLength={120} required
                            onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium">สาขา</span>
                        <input className={input} value={form.program} maxLength={120} required
                            onChange={(e) => setForm({ ...form, program: e.target.value })} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium">ชั้นปี</span>
                        <select className={input} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => <option key={y} value={y}>ปี {y}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium">รหัสนักศึกษา</span>
                        <input className={`${input} opacity-60`} value={student.studentId} disabled />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                        <span className="text-sm font-medium">Bio</span>
                        <textarea className={input} rows={3} maxLength={500} value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                        <span className="text-xs text-muted-foreground">{form.bio.length}/500</span>
                    </label>
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={busy || !dirty}
                        className="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-40">
                        บันทึกข้อมูล
                    </button>
                </div>
            </form>

            {/* Interests */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">✨ ความสนใจ ({selected.length})</h2>
                <div className="flex flex-wrap gap-2">
                    {selected.length === 0 && <p className="text-sm text-muted-foreground italic">ยังไม่มีความสนใจ</p>}
                    {selected.map((i) => (
                        <span key={i.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {i.icon} {i.name}
                            <button type="button" onClick={() => removeInterest(i.id)} disabled={busy}
                                className="ml-1 hover:text-destructive" aria-label={`ลบ ${i.name}`}>×</button>
                        </span>
                    ))}
                </div>
                <div className="border-t border-border pt-4">
                    <InterestPicker
                        allInterests={allInterests}
                        categories={categories}
                        selectedIds={interestIds}
                        disabled={busy}
                        onAdd={addInterest}
                        onCreate={createInterest}
                    />
                </div>
            </div>

            {/* Groups & activities this student is in (managed from their own admin pages) */}
            <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                    <h2 className="text-lg font-semibold">👥 กลุ่ม ({groups.length})</h2>
                    {groups.length === 0 && <p className="text-sm text-muted-foreground italic">ยังไม่ได้เข้ากลุ่มไหน</p>}
                    {groups.map((g) => (
                        <Link key={g.id} href={`/admin/groups/${g.id}`} className="flex items-center justify-between text-sm hover:text-primary">
                            <span className="truncate">{g.name}</span>
                            {g.creatorId === student.id && <span className="text-xs text-amber-700">👑 ผู้สร้าง</span>}
                        </Link>
                    ))}
                </div>
                <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                    <h2 className="text-lg font-semibold">🎯 กิจกรรม ({activities.length})</h2>
                    {activities.length === 0 && <p className="text-sm text-muted-foreground italic">ยังไม่ได้เข้าร่วมกิจกรรม</p>}
                    {activities.map((a) => (
                        <Link key={a.id} href={`/admin/activities/${a.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-primary">
                            <span className="truncate">{a.title}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.date)}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Looking for */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <h2 className="text-lg font-semibold">🔎 กำลังมองหา</h2>
                <div className="flex flex-wrap gap-2">
                    {lookingForOptions.map((lf) => {
                        const on = lookingForIds.includes(lf.id);
                        return (
                            <button type="button" key={lf.id} onClick={() => toggleLf(lf.id)} disabled={busy}
                                className={`px-3 py-1.5 rounded-full text-sm transition ${on ? "bg-primary text-white" : "bg-accent hover:bg-primary/10"}`}>
                                {lf.icon} {lf.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
