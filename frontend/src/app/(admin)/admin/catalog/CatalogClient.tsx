"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    createCategory,
    createLookingFor,
    deleteCategory,
    deleteLookingFor,
    updateCategory,
    updateLookingFor,
} from "@/lib/actions";
import { CategoryWithCount, LookingForWithCount } from "@/lib/data/interests";
import { CATEGORY_COLORS } from "@/components/category-colors";
import { ConfirmButton } from "@/components/ConfirmButton";

const input = "px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

type Result = { success: boolean; error?: string; removedFromStudents?: number };

export function CatalogClient({ categories, lookingFor }: { categories: CategoryWithCount[]; lookingFor: LookingForWithCount[] }) {
    const router = useRouter();
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const run = async (fn: () => Promise<Result>, okText: (r: Result) => string) => {
        setBusy(true);
        const res = await fn();
        setBusy(false);
        setMsg(res.success ? { ok: true, text: okText(res) } : { ok: false, text: res.error || "ไม่สำเร็จ" });
        setTimeout(() => setMsg(null), 4000);
        if (res.success) router.refresh();
        return res.success;
    };

    // ── categories ──
    const [newCat, setNewCat] = useState({ name: "", icon: "✨", color: CATEGORY_COLORS[0].value as string });
    const [editCat, setEditCat] = useState<{ id: string; name: string; icon: string; color: string } | null>(null);
    // ── looking-for ──
    const [newLf, setNewLf] = useState({ label: "", icon: "✨" });
    const [editLf, setEditLf] = useState<{ id: string; label: string; icon: string } | null>(null);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">🗂️ หมวดหมู่ & กำลังหา</h1>
                <p className="text-muted-foreground mt-1">จัดการหมวดหมู่ของ Interest และตัวเลือก &quot;กำลังหา&quot; ที่นักศึกษาเลือกได้</p>
            </div>

            {msg && (
                <div className={`p-3 rounded-lg text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{msg.text}</div>
            )}

            {/* Categories */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">📂 หมวดหมู่ Interest ({categories.length})</h2>
                <form
                    className="flex flex-wrap gap-2 items-center"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (await run(() => createCategory({ ...newCat, name: newCat.name.trim() }), () => `✅ เพิ่มหมวด "${newCat.name.trim()}" แล้ว`)) {
                            setNewCat({ ...newCat, name: "" });
                        }
                    }}
                >
                    <input aria-label="ไอคอนหมวดใหม่" className={`${input} w-16`} value={newCat.icon} maxLength={16} onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })} />
                    <input aria-label="ชื่อหมวดใหม่" className={`${input} flex-1 min-w-40`} placeholder="ชื่อหมวดใหม่ เช่น Anime & Manga" value={newCat.name} maxLength={40} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
                    <select aria-label="สีหมวดใหม่" className={input} value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}>
                        {CATEGORY_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <button type="submit" disabled={busy || newCat.name.trim().length < 2} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40">เพิ่มหมวด</button>
                </form>

                <div className="divide-y divide-border">
                    {categories.map((c) => (
                        <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                            {editCat?.id === c.id ? (
                                <>
                                    <input aria-label="ไอคอน" className={`${input} w-16`} value={editCat.icon} maxLength={16} onChange={(e) => setEditCat({ ...editCat, icon: e.target.value })} />
                                    <input aria-label="ชื่อ" className={`${input} flex-1 min-w-40`} value={editCat.name} maxLength={40} onChange={(e) => setEditCat({ ...editCat, name: e.target.value })} />
                                    <select aria-label="สี" className={input} value={editCat.color} onChange={(e) => setEditCat({ ...editCat, color: e.target.value })}>
                                        {CATEGORY_COLORS.map((col) => <option key={col.value} value={col.value}>{col.label}</option>)}
                                    </select>
                                    <button type="button" disabled={busy || editCat.name.trim().length < 2}
                                        onClick={async () => { if (await run(() => updateCategory(c.id, { name: editCat.name.trim(), icon: editCat.icon, color: editCat.color }), () => "✅ แก้ไขหมวดแล้ว")) setEditCat(null); }}
                                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm disabled:opacity-40">บันทึก</button>
                                    <button type="button" onClick={() => setEditCat(null)} className="px-3 py-1.5 rounded-lg border border-border text-sm">ยกเลิก</button>
                                </>
                            ) : (
                                <>
                                    <span className={`px-3 py-1 rounded-full border text-sm font-medium ${c.color}`}>{c.icon} {c.name}</span>
                                    <span className="flex-1 text-xs text-muted-foreground">{c.interestCount} interest</span>
                                    <button type="button" onClick={() => setEditCat({ id: c.id, name: c.name, icon: c.icon, color: c.color })}
                                        className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent">แก้ไข</button>
                                    <ConfirmButton
                                        disabled={c.interestCount > 0}
                                        onConfirm={() => run(() => deleteCategory(c.id), () => `✅ ลบหมวด "${c.name}" แล้ว`).then(() => undefined)}
                                        confirmLabel="ยืนยันลบ?"
                                    >
                                        {c.interestCount > 0 ? "ลบไม่ได้ (มี interest)" : "ลบ"}
                                    </ConfirmButton>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Looking-for options */}
            <section className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">🔎 ตัวเลือก &quot;กำลังหา&quot; ({lookingFor.length})</h2>
                <form
                    className="flex flex-wrap gap-2 items-center"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (await run(() => createLookingFor({ ...newLf, label: newLf.label.trim() }), () => `✅ เพิ่ม "${newLf.label.trim()}" แล้ว`)) {
                            setNewLf({ ...newLf, label: "" });
                        }
                    }}
                >
                    <input aria-label="ไอคอนตัวเลือกใหม่" className={`${input} w-16`} value={newLf.icon} maxLength={16} onChange={(e) => setNewLf({ ...newLf, icon: e.target.value })} />
                    <input aria-label="ข้อความตัวเลือกใหม่" className={`${input} flex-1 min-w-40`} placeholder="เช่น หาเพื่อนติวสอบ" value={newLf.label} maxLength={60} onChange={(e) => setNewLf({ ...newLf, label: e.target.value })} />
                    <button type="submit" disabled={busy || newLf.label.trim().length < 2} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40">เพิ่มตัวเลือก</button>
                </form>

                <div className="divide-y divide-border">
                    {lookingFor.map((o) => (
                        <div key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                            {editLf?.id === o.id ? (
                                <>
                                    <input aria-label="ไอคอน" className={`${input} w-16`} value={editLf.icon} maxLength={16} onChange={(e) => setEditLf({ ...editLf, icon: e.target.value })} />
                                    <input aria-label="ข้อความ" className={`${input} flex-1 min-w-40`} value={editLf.label} maxLength={60} onChange={(e) => setEditLf({ ...editLf, label: e.target.value })} />
                                    <button type="button" disabled={busy || editLf.label.trim().length < 2}
                                        onClick={async () => { if (await run(() => updateLookingFor(o.id, { label: editLf.label.trim(), icon: editLf.icon }), () => "✅ แก้ไขแล้ว")) setEditLf(null); }}
                                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm disabled:opacity-40">บันทึก</button>
                                    <button type="button" onClick={() => setEditLf(null)} className="px-3 py-1.5 rounded-lg border border-border text-sm">ยกเลิก</button>
                                </>
                            ) : (
                                <>
                                    <span className="px-3 py-1 rounded-full bg-accent text-sm">{o.icon} {o.label}</span>
                                    <span className="flex-1 text-xs text-muted-foreground">นักศึกษาเลือก {o.studentCount} คน</span>
                                    <button type="button" onClick={() => setEditLf({ id: o.id, label: o.label, icon: o.icon })}
                                        className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent">แก้ไข</button>
                                    <ConfirmButton
                                        onConfirm={() => run(() => deleteLookingFor(o.id), (r) => `✅ ลบแล้ว (เอาออกจากนักศึกษา ${r.removedFromStudents ?? 0} คน)`).then(() => undefined)}
                                        confirmLabel={o.studentCount ? `ลบ? มีคนเลือก ${o.studentCount}` : "ยืนยันลบ?"}
                                    >
                                        ลบ
                                    </ConfirmButton>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
