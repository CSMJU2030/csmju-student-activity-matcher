"use client";

import { useState } from "react";
import {
    adminCreateInterest,
    adminToggleInterest,
    adminUpdateInterest,
} from "@/lib/actions";
import { InterestWithCategory, InterestCategoryData } from "@/lib/data/interests";
import { useRouter } from "next/navigation";

interface InterestUsageItem {
    id: string;
    name: string;
    icon: string;
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    isCustom: boolean;
    isActive: boolean;
    studentCount: number;
}

interface CategoryStat {
    id: string;
    name: string;
    icon: string;
    color: string;
    interestCount: number;
    totalStudentUsage: number;
}

interface Statistics {
    totalInterests: number;
    customInterests: number;
    totalStudents: number;
    studentsWithNoInterests: number;
    interestUsage: InterestUsageItem[];
    categoryStats: CategoryStat[];
}

interface AdminInterestsClientProps {
    allInterests: InterestWithCategory[];
    allCategories: InterestCategoryData[];
    statistics: Statistics;
}

export function AdminInterestsClient({
    allInterests,
    allCategories,
    statistics,
}: AdminInterestsClientProps) {
    const router = useRouter();
    const [newName, setNewName] = useState("");
    const [newCategoryId, setNewCategoryId] = useState(allCategories[0]?.id || "");
    const [newIcon, setNewIcon] = useState("⭐");
    const [filterCategory, setFilterCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const showMsg = (text: string) => {
        setMsg(text);
        setTimeout(() => setMsg(""), 3000);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        const result = await adminCreateInterest(newName.trim(), newCategoryId, newIcon);
        if (result.success) {
            showMsg("✅ สร้างสำเร็จ");
            setNewName("");
            router.refresh();
        } else {
            showMsg(`❌ ${result.error}`);
        }
        setLoading(false);
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        setLoading(true);
        const result = await adminToggleInterest(id, !isActive);
        if (result.success) {
            showMsg(isActive ? "🔴 ปิดใช้งานแล้ว" : "🟢 เปิดใช้งานแล้ว");
            router.refresh();
        }
        setLoading(false);
    };

    const filteredInterests = statistics.interestUsage.filter((i) => {
        if (filterCategory !== "all" && i.categoryId !== filterCategory) return false;
        if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const topInterests = [...statistics.interestUsage].sort((a, b) => b.studentCount - a.studentCount).slice(0, 10);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {msg && (
                <div className="fixed top-4 right-4 bg-card border border-border rounded-xl shadow-lg px-4 py-3 text-sm z-50 animate-in slide-in-from-top">
                    {msg}
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold">🎯 จัดการ Interest</h1>
                <p className="text-muted-foreground mt-1">
                    จัดการ Interest, ดูสถิติ, และสร้าง Interest ใหม่
                </p>
            </div>

            {/* Statistics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-5 text-center">
                    <p className="text-3xl font-bold text-primary">{statistics.totalInterests}</p>
                    <p className="text-xs text-muted-foreground mt-1">Interest ทั้งหมด</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5 text-center">
                    <p className="text-3xl font-bold text-amber-500">{statistics.customInterests}</p>
                    <p className="text-xs text-muted-foreground mt-1">Custom Interest</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5 text-center">
                    <p className="text-3xl font-bold text-primary">{statistics.totalStudents}</p>
                    <p className="text-xs text-muted-foreground mt-1">นักศึกษาทั้งหมด</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5 text-center">
                    <p className="text-3xl font-bold text-secondary-foreground">{statistics.studentsWithNoInterests}</p>
                    <p className="text-xs text-muted-foreground mt-1">ไม่มี Interest</p>
                </div>
            </div>

            {/* Top 10 Interests */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold mb-4">🏆 Top 10 Interest ยอดนิยม</h2>
                <div className="space-y-3">
                    {topInterests.map((interest, index) => (
                        <div key={interest.id} className="flex items-center gap-3">
                            <span className="text-lg w-8 text-center font-bold text-muted-foreground">
                                {index + 1}
                            </span>
                            <span className="text-xl">{interest.icon}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{interest.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                                        {interest.categoryName}
                                    </span>
                                    {interest.isCustom && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Custom</span>
                                    )}
                                </div>
                                <div className="mt-1 bg-accent rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all"
                                        style={{
                                            width: `${topInterests[0]?.studentCount
                                                ? (interest.studentCount / topInterests[0].studentCount) * 100
                                                : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-primary min-w-[3rem] text-right">
                                {interest.studentCount} คน
                            </span>
                        </div>
                    ))}
                    {topInterests.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">ยังไม่มีข้อมูล</p>
                    )}
                </div>
            </div>

            {/* Category Stats */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold mb-4">📊 สถิติตามหมวดหมู่</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {statistics.categoryStats.map((cat) => (
                        <div key={cat.id} className="rounded-xl border border-border p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{cat.icon}</span>
                                <span className="font-medium text-sm">{cat.name}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold">{cat.interestCount}</span>
                                <span className="text-xs text-muted-foreground">interests</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {cat.totalStudentUsage} คนเลือก
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create New Interest */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold mb-4">➕ สร้าง Interest ใหม่</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="ชื่อ Interest..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Icon"
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        className="w-16 px-3 py-2.5 rounded-xl border border-border text-center text-xl"
                    />
                    <select
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-border text-sm"
                    >
                        {allCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !newName.trim()}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                        สร้าง
                    </button>
                </div>
            </div>

            {/* All Interests Table */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold mb-4">📋 Interest ทั้งหมด</h2>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="ค้นหา..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-border text-sm"
                    />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-border text-sm"
                    >
                        <option value="all">ทุกหมวดหมู่</option>
                        {allCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                                <th className="pb-3 px-3">Interest</th>
                                <th className="pb-3 px-3">หมวดหมู่</th>
                                <th className="pb-3 px-3 text-center">นักศึกษา</th>
                                <th className="pb-3 px-3 text-center">ประเภท</th>
                                <th className="pb-3 px-3 text-center">สถานะ</th>
                                <th className="pb-3 px-3 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInterests.map((interest) => (
                                <tr
                                    key={interest.id}
                                    className={`border-b border-border/50 last:border-0 ${!interest.isActive ? "opacity-50" : ""}`}
                                >
                                    <td className="py-3 px-3">
                                        <span className="font-medium">
                                            {interest.icon} {interest.name}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-sm text-muted-foreground">
                                        {interest.categoryName}
                                    </td>
                                    <td className="py-3 px-3 text-center font-medium">
                                        {interest.studentCount}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        {interest.isCustom ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                Custom
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-primary">
                                                Official
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        {interest.isActive ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-primary">Active</span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-primary">Inactive</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <button
                                            onClick={() => handleToggle(interest.id, interest.isActive)}
                                            disabled={loading}
                                            className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-accent disabled:opacity-50"
                                        >
                                            {interest.isActive ? "ปิด" : "เปิด"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredInterests.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground text-sm">ไม่พบ Interest</p>
                )}
            </div>
        </div>
    );
}
