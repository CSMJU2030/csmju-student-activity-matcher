"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { InterestWithCategory, InterestCategoryData, LookingForOptionData } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { getInitials } from "@/lib/utils";

interface DiscoverClientProps {
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
    allCategories: InterestCategoryData[];
    lookingForOptions: LookingForOptionData[];
}

export function DiscoverClient({
    allStudents,
    allInterests,
    allCategories,
    lookingForOptions,
}: DiscoverClientProps) {
    const { user } = useAuth();
    const currentStudent = user?.studentId
        ? allStudents.find((s) => s.id === user.studentId)
        : null;

    const [search, setSearch] = useState("");
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedLookingFor, setSelectedLookingFor] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const getInterestsByIds = (ids: string[]) =>
        allInterests.filter((i) => ids.includes(i.id));

    const filteredStudents = useMemo(() => {
        const searchLower = search.toLowerCase().trim();

        return allStudents
            .filter((s) => s.id !== currentStudent?.id)
            .filter((s) => {
                // Text search — match by name or by interest name
                if (searchLower) {
                    const nameMatch = s.name.toLowerCase().includes(searchLower);
                    const interestMatch = getInterestsByIds(s.interestIds).some((i) =>
                        i.name.toLowerCase().includes(searchLower)
                    );
                    if (!nameMatch && !interestMatch) return false;
                }
                if (selectedYear && s.year !== parseInt(selectedYear)) return false;
                if (selectedLookingFor && !s.lookingForIds.includes(selectedLookingFor))
                    return false;
                if (
                    selectedInterests.length > 0 &&
                    !selectedInterests.some((id) => s.interestIds.includes(id))
                )
                    return false;
                return true;
            })
            .map((s) => {
                // Calculate match with current student
                let commonCount = 0;
                let matchPercentage = 0;
                const commonInterestsList: InterestWithCategory[] = [];

                if (currentStudent) {
                    const mySet = new Set(currentStudent.interestIds);
                    const theirSet = new Set(s.interestIds);
                    const common = [...mySet].filter((id) => theirSet.has(id));
                    commonCount = common.length;
                    const union = new Set([...mySet, ...theirSet]).size;
                    matchPercentage = union > 0 ? Math.round((commonCount / union) * 100) : 0;
                    common.forEach((id) => {
                        const interest = allInterests.find((i) => i.id === id);
                        if (interest) commonInterestsList.push(interest);
                    });
                }

                return {
                    student: s,
                    commonCount,
                    matchPercentage,
                    commonInterests: commonInterestsList,
                };
            })
            .sort((a, b) => b.matchPercentage - a.matchPercentage);
    }, [allStudents, currentStudent, search, selectedInterests, selectedYear, selectedLookingFor, allInterests]);

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedInterests([]);
        setSelectedYear("");
        setSelectedLookingFor("");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">👥 ค้นหาเพื่อน (Discover)</h1>
                    <p className="text-muted-foreground mt-1">
                        ค้นหานักศึกษาที่มีความสนใจคล้ายกัน หรือหาเพื่อนในสายเดียวกัน
                    </p>
                </div>
                <Link href="/profile" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-xl hover:bg-primary/20 transition-colors text-sm border border-primary/20">
                    <span className="text-lg">🎯</span> เพิ่มความสนใจเพื่อสร้าง Match
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ หรือ Interest..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters
                            ? "bg-primary text-white border-primary"
                            : "border-border hover:bg-accent"
                            }`}
                    >
                        🔧 ตัวกรอง
                    </button>
                </div>

                {showFilters && (
                    <div className="space-y-4 pt-4 border-t border-border">
                        {/* Year */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">ชั้นปี</label>
                            <div className="flex gap-2 flex-wrap">
                                {["", "1", "2", "3", "4"].map((y) => (
                                    <button
                                        key={y}
                                        onClick={() => setSelectedYear(y)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedYear === y
                                            ? "bg-primary text-white"
                                            : "bg-accent hover:bg-accent/80"
                                            }`}
                                    >
                                        {y || "ทั้งหมด"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Looking For */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">กำลังหา</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedLookingFor("")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedLookingFor
                                        ? "bg-primary text-white"
                                        : "bg-accent hover:bg-accent/80"
                                        }`}
                                >
                                    ทั้งหมด
                                </button>
                                {lookingForOptions.map((lf) => (
                                    <button
                                        key={lf.id}
                                        onClick={() =>
                                            setSelectedLookingFor(lf.id === selectedLookingFor ? "" : lf.id)
                                        }
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedLookingFor === lf.id
                                            ? "bg-primary text-white"
                                            : "bg-accent hover:bg-accent/80"
                                            }`}
                                    >
                                        {lf.icon} {lf.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interest Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Interest</label>
                            <div className="space-y-3">
                                {allCategories.map((cat) => (
                                    <div key={cat.id}>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {cat.icon} {cat.name}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {allInterests
                                                .filter((i) => i.categoryId === cat.id)
                                                .map((interest) => (
                                                    <button
                                                        key={interest.id}
                                                        onClick={() => toggleInterest(interest.id)}
                                                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${selectedInterests.includes(interest.id)
                                                            ? "bg-primary text-white"
                                                            : "bg-accent hover:bg-accent/80"
                                                            }`}
                                                    >
                                                        {interest.icon} {interest.name}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <p className="text-sm text-muted-foreground">พบ {filteredStudents.length} คน</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(({ student, commonCount, matchPercentage, commonInterests }) => {
                    const studentInterests = getInterestsByIds(student.interestIds).slice(0, 3);
                    return (
                        <Link
                            key={student.id}
                            href={`/students/${student.id}`}
                            className="bg-card rounded-xl border border-border p-5 card-hover block"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shrink-0">
                                    {getInitials(student.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{student.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        รหัส {student.year}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {studentInterests.map((interest) => (
                                    <span
                                        key={interest.id}
                                        className="text-xs px-2 py-0.5 rounded-full bg-accent"
                                    >
                                        {interest.icon} {interest.name}
                                    </span>
                                ))}
                                {student.interestIds.length > 3 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                                        +{student.interestIds.length - 3}
                                    </span>
                                )}
                            </div>
                            {commonCount > 0 && (
                                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        สนใจเหมือนกัน {commonCount} อย่าง
                                    </span>
                                    <span className="text-sm font-bold text-primary">
                                        {matchPercentage}%
                                    </span>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {filteredStudents.length === 0 && (
                <div className="text-center py-16">
                    <span className="text-4xl">😔</span>
                    <p className="text-muted-foreground mt-3">ไม่พบนักศึกษาที่ตรงตามเงื่อนไข</p>
                    <button
                        onClick={clearFilters}
                        className="mt-3 text-sm text-primary hover:underline"
                    >
                        ล้างตัวกรอง
                    </button>
                </div>
            )}
        </div>
    );
}
