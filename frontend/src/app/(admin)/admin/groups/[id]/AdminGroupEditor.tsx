"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteGroup, removeGroupMember, updateGroup } from "@/lib/actions";
import { GroupData } from "@/lib/data/groups";
import { InterestWithCategory } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { formatDate, getInitials } from "@/lib/utils";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InterestMultiSelect } from "@/components/InterestMultiSelect";
import { Icon } from "@/components/Icon";

interface Props {
    group: GroupData;
    allInterests: InterestWithCategory[];
    allStudents: StudentData[];
}

export function AdminGroupEditor({ group, allInterests, allStudents }: Props) {
    const router = useRouter();
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description);
    const [interestIds, setInterestIds] = useState(group.interests.map((i) => i.interestId));
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const flash = (ok: boolean, text: string) => {
        setMsg({ ok, text });
        setTimeout(() => setMsg(null), 3500);
    };
    const studentById = (id: string) => allStudents.find((s) => s.id === id);
    const creator = studentById(group.creatorId);
    const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
    const dirty = name !== group.name || description !== group.description || !sameIds(interestIds, group.interests.map((i) => i.interestId));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        const res = await updateGroup(group.id, { name, description, interestIds });
        setBusy(false);
        if (res.success) { flash(true, "บันทึกแล้ว — นักศึกษาเห็นข้อมูลใหม่ทันที"); router.refresh(); }
        else flash(false, res.error || "บันทึกไม่สำเร็จ");
    };

    const kick = async (studentId: string) => {
        const res = await removeGroupMember(group.id, studentId);
        if (res.success) { flash(true, "นำออกจากกลุ่มแล้ว (แจ้งเตือนเจ้าตัวแล้ว)"); router.refresh(); }
        else flash(false, res.error || "นำออกไม่สำเร็จ");
    };

    const remove = async () => {
        const res = await deleteGroup(group.id);
        if (res.success) router.push("/admin/groups");
        else flash(false, res.error || "ลบไม่สำเร็จ");
    };

    const input = "w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/admin/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Icon name="arrow-left" className="h-4 w-4" /> กลับไปรายการกลุ่ม</Link>

            <div className="bg-card rounded-xl border border-border p-6 flex flex-wrap items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white"><Icon name="users" className="h-7 w-7" /></div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate">{group.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        สร้างโดย {creator?.name ?? "-"} · {formatDate(group.createdAt)} · สมาชิก {group.members.length} คน
                    </p>
                </div>
                <ConfirmButton onConfirm={remove} confirmLabel="กดอีกครั้งเพื่อลบกลุ่ม"><span className="inline-flex items-center gap-1.5"><Icon name="trash" className="h-4 w-4" /> ลบกลุ่ม</span></ConfirmButton>
            </div>

            {msg && (
                <div className={`p-3 rounded-lg text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>
            )}

            <form onSubmit={save} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="edit" className="h-5 w-5" /> ข้อมูลกลุ่ม</h2>
                <label className="block space-y-1">
                    <span className="text-sm font-medium">ชื่อกลุ่ม</span>
                    <input className={input} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required />
                </label>
                <label className="block space-y-1">
                    <span className="text-sm font-medium">รายละเอียด</span>
                    <textarea className={input} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} required />
                </label>
                <div className="space-y-1">
                    <span className="text-sm font-medium">ความสนใจของกลุ่ม</span>
                    <InterestMultiSelect allInterests={allInterests} value={interestIds} onChange={setInterestIds} />
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={busy || !dirty || interestIds.length === 0}
                        className="px-5 py-2 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">บันทึก</button>
                </div>
            </form>

            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="user" className="h-5 w-5" /> สมาชิก ({group.members.length})</h2>
                <div className="divide-y divide-border">
                    {group.members.map(({ studentId }) => {
                        const s = studentById(studentId);
                        const isCreator = studentId === group.creatorId;
                        return (
                            <div key={studentId} className="flex items-center gap-3 py-2.5">
                                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                    {getInitials(s?.name ?? "?")}
                                </div>
                                <Link href={`/admin/students/${studentId}`} className="flex-1 min-w-0 hover:text-primary rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <p className="text-sm font-medium truncate">{s?.name ?? studentId}</p>
                                    <p className="text-xs text-muted-foreground">{s?.studentId}</p>
                                </Link>
                                {isCreator ? (
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"><Icon name="star" className="h-3.5 w-3.5" /> ผู้สร้าง</span>
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
