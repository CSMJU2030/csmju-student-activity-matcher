"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StudentData } from "@/lib/data/students";
import { Icon } from "@/components/Icon";

interface AdminStudentsClientProps {
    students: StudentData[];
}

export function AdminStudentsClient({ students }: AdminStudentsClientProps) {
    const [search, setSearch] = useState("");
    const [yearFilter, setYearFilter] = useState("");

    const filtered = useMemo(() => {
        return students.filter((s) => {
            if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
                !s.studentId.includes(search)) return false;
            if (yearFilter && s.year !== parseInt(yearFilter)) return false;
            return true;
        });
    }, [students, search, yearFilter]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="graduation" className="h-6 w-6" /> นักศึกษา</h1>
                    <p className="text-muted-foreground mt-1">จัดการข้อมูลนักศึกษา ({students.length} คน)</p>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-primary">
                        แหล่งข้อมูล: PostgreSQL
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="ค้นหานักศึกษา"
                />

                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm min-w-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="กรองตามชั้นปี">
                    <option value="">ทุกชั้นปี</option>
                    <option value="1">ปี 1</option>
                    <option value="2">ปี 2</option>
                    <option value="3">ปี 3</option>
                    <option value="4">ปี 4</option>
                </select>
            </div>

            <p className="text-sm text-muted-foreground">แสดง {filtered.length} จาก {students.length} คน</p>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-accent/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">นักศึกษา</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">คณะ/หลักสูตร</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">ชั้นปี</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">ความสนใจ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((student) => (
                                <tr key={student.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/students/${student.id}`} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                                {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate hover:text-primary">{student.name}</p>
                                                <p className="text-xs text-muted-foreground">{student.studentId}</p>
                                            </div>
                                        </Link>
                                    </td>

                                    <td className="px-4 py-3 text-center text-xs text-muted-foreground max-w-[120px] truncate">{student.faculty} / {student.program}</td>
                                    <td className="px-4 py-3 text-center tabular-nums">{student.year}</td>
                                    <td className="px-4 py-3 text-center tabular-nums">{student.interestIds.length}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                        ไม่พบนักศึกษาที่ตรงกับคำค้นหา ลองซิงก์ข้อมูลจาก REG หรือเปลี่ยนตัวกรอง
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
