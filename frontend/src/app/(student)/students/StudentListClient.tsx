"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StudentData } from "@/lib/data/students";

interface StudentListClientProps {
    students: StudentData[];
}

export function StudentListClient({ students }: StudentListClientProps) {
    const [search, setSearch] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [page, setPage] = useState(1);

    // Config
    const PAGE_SIZE = 12;

    const filtered = useMemo(() => {
        return students.filter((s) => {
            if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
                !s.studentId.includes(search)) return false;
            if (yearFilter && s.year !== parseInt(yearFilter)) return false;
            return true;
        });
    }, [students, search, yearFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

    // Pagination slicing
    const paginated = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    // Error constraint handled gracefully through empty states
    // Loading state handled natively by Next.js loading.tsx boundaries

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="graduation" className="h-6 w-6 text-primary" /> นักศึกษาวิทยาการคอมพิวเตอร์</h1>
                    <p className="text-muted-foreground mt-1">ฐานข้อมูลนักศึกษา (Official Maejo REG)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="ค้นหาด้วยชื่อหรือรหัสนักศึกษา..."
                    aria-label="ค้นหานักศึกษา"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                <select value={yearFilter} onChange={(e) => {
                    setYearFilter(e.target.value);
                    setPage(1);
                }}
                    className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm min-w-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="กรองตามชั้นปี">
                    <option value="">ทุกชั้นปี</option>
                    <option value="2567">ปี 1 (2567)</option>
                    <option value="2566">ปี 2 (2566)</option>
                    <option value="2565">ปี 3 (2565)</option>
                    <option value="2564">ปี 4 (2564)</option>
                </select>
            </div>

            {/* Grid */}
            {paginated.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginated.map((student) => (
                        <Link
                            key={student.id}
                            href={`/students/${student.id}`}
                            className="bg-card rounded-xl border border-border p-5 transition-shadow hover:shadow-md flex flex-col items-center text-center object-cover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold shrink-0 mb-3">
                                {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <h3 className="font-semibold text-foreground truncate w-full">{student.name}</h3>
                            <p className="text-sm text-muted-foreground">{student.studentId}</p>
                            <div className="mt-2 text-xs font-medium bg-accent px-3 py-1 rounded-full text-foreground/80">
                                รหัส {student.year}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <span className="flex justify-center mb-4 text-muted-foreground"><Icon name="search" className="h-10 w-10" /></span>
                    <h3 className="text-lg font-bold">ไม่พบข้อมูล</h3>
                    <p className="text-muted-foreground mt-1">ลองเปลี่ยนคำค้นหา หรือชั้นปีดูใหม่อีกครั้ง</p>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 border border-border rounded-lg bg-card disabled:opacity-50 hover:bg-accent transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        ก่อนหน้า
                    </button>
                    <span className="text-sm font-medium px-4 tabular-nums">
                        หน้า {page} จาก {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 border border-border rounded-lg bg-card disabled:opacity-50 hover:bg-accent transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        ถัดไป
                    </button>
                </div>
            )}
        </div>
    );
}
