"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteActivity, removeActivityParticipant, updateActivity } from "@/lib/actions";
import { ActivityData } from "@/lib/data/activities";
import { InterestWithCategory } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { getInitials } from "@/lib/utils";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InterestMultiSelect } from "@/components/InterestMultiSelect";

interface Props {
    activity: ActivityData;
    allInterests: InterestWithCategory[];
    allStudents: StudentData[];
}

export function AdminActivityEditor({ activity, allInterests, allStudents }: Props) {
    const router = useRouter();
    const initial = {
        title: activity.title,
        description: activity.description,
        date: activity.date,
        time: activity.time,
        location: activity.location,
        capacity: String(activity.capacity),
    };
    const [form, setForm] = useState(initial);
    const [interestIds, setInterestIds] = useState(activity.interests.map((i) => i.interestId));
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const flash = (ok: boolean, text: string) => {
        setMsg({ ok, text });
        setTimeout(() => setMsg(null), 4000);
    };
    const studentById = (id: string) => allStudents.find((s) => s.id === id);
    const creator = studentById(activity.creatorId);
    const joined = activity.participants.length;
    const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
    const changed = (Object.keys(initial) as (keyof typeof initial)[]).filter((k) => form[k] !== initial[k]);
    const dirty = changed.length > 0 || !sameIds(interestIds, activity.interests.map((i) => i.interestId));
    const notifiesParticipants = changed.some((k) => k === "date" || k === "time" || k === "location");

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        // Send only what changed, so an unchanged past date is not re-validated.
        const patch: Record<string, unknown> = { interestIds };
        for (const k of changed) patch[k] = k === "capacity" ? Number(form.capacity) : form[k];
        const res = await updateActivity(activity.id, patch);
        setBusy(false);
        if (res.success) {
            flash(true, notifiesParticipants ? "✅ บันทึกแล้ว และแจ้งเตือนผู้เข้าร่วมเรื่องวัน/เวลา/สถานที่ใหม่แล้ว" : "✅ บันทึกแล้ว");
            router.refresh();
        } else flash(false, res.error || "บันทึกไม่สำเร็จ");
    };

    const kick = async (studentId: string) => {
        const res = await removeActivityParticipant(activity.id, studentId);
        if (res.success) { flash(true, "✅ นำออกแล้ว (แจ้งเตือนเจ้าตัวแล้ว)"); router.refresh(); }
        else flash(false, res.error || "นำออกไม่สำเร็จ");
    };

    const remove = async () => {
        const res = await deleteActivity(activity.id);
        if (res.success) router.push("/admin/activities");
        else flash(false, res.error || "ลบไม่สำเร็จ");
    };

    const input = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
    const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/admin/activities" className="text-sm text-muted-foreground hover:text-primary">← กลับไปรายการกิจกรรม</Link>

            <div className="bg-card rounded-xl border border-border p-6 flex flex-wrap items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center text-2xl">🎯</div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate">{activity.title}</h1>
                    <p className="text-sm text-muted-foreground">สร้างโดย {creator?.name ?? "-"} · ผู้เข้าร่วม {joined}/{activity.capacity}</p>
                </div>
                <ConfirmButton onConfirm={remove} confirmLabel="กดอีกครั้งเพื่อยกเลิกกิจกรรม">🗑️ ยกเลิกกิจกรรม</ConfirmButton>
            </div>

            {msg && (
                <div className={`p-3 rounded-lg text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>
            )}

            <form onSubmit={save} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">📝 ข้อมูลกิจกรรม</h2>
                <label className="block space-y-1">
                    <span className="text-sm font-medium">ชื่อกิจกรรม</span>
                    <input className={input} value={form.title} onChange={set("title")} minLength={2} maxLength={200} required />
                </label>
                <label className="block space-y-1">
                    <span className="text-sm font-medium">รายละเอียด</span>
                    <textarea className={input} rows={3} value={form.description} onChange={set("description")} maxLength={2000} required />
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <span className="text-sm font-medium">วันที่</span>
                        <input type="date" className={input} value={form.date} onChange={set("date")} required />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium">เวลา</span>
                        <input type="time" className={input} value={form.time} onChange={set("time")} required />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium">สถานที่</span>
                        <input className={input} value={form.location} onChange={set("location")} maxLength={200} required />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-medium">รับได้ (คน)</span>
                        <input type="number" className={input} value={form.capacity} onChange={set("capacity")} min={Math.max(2, joined)} max={1000} required />
                        <span className="text-[11px] text-muted-foreground">ต้องไม่น้อยกว่าคนที่เข้าร่วมแล้ว ({joined} คน)</span>
                    </label>
                </div>
                <div className="space-y-1">
                    <span className="text-sm font-medium">ความสนใจที่เกี่ยวข้อง</span>
                    <InterestMultiSelect allInterests={allInterests} value={interestIds} onChange={setInterestIds} />
                </div>
                {notifiesParticipants && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">🔔 เปลี่ยนวัน/เวลา/สถานที่ ระบบจะแจ้งเตือนผู้เข้าร่วมทุกคน</p>
                )}
                <div className="flex justify-end">
                    <button type="submit" disabled={busy || !dirty}
                        className="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-40">บันทึก</button>
                </div>
            </form>

            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <h2 className="text-lg font-semibold">👤 ผู้เข้าร่วม ({joined}/{activity.capacity})</h2>
                <div className="divide-y divide-border">
                    {activity.participants.map(({ studentId }) => {
                        const s = studentById(studentId);
                        const isCreator = studentId === activity.creatorId;
                        return (
                            <div key={studentId} className="flex items-center gap-3 py-2.5">
                                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                    {getInitials(s?.name ?? "?")}
                                </div>
                                <Link href={`/admin/students/${studentId}`} className="flex-1 min-w-0 hover:text-primary">
                                    <p className="text-sm font-medium truncate">{s?.name ?? studentId}</p>
                                    <p className="text-xs text-muted-foreground">{s?.studentId}</p>
                                </Link>
                                {isCreator ? (
                                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">👑 ผู้สร้าง</span>
                                ) : (
                                    <ConfirmButton onConfirm={() => kick(studentId)} confirmLabel="ยืนยันนำออก?">นำออก</ConfirmButton>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
