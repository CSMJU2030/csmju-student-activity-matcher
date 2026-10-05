"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { InterestWithCategory, InterestCategoryData, LookingForOptionData } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { getInitials } from "@/lib/utils";
import { fetchJsonWithAuth } from "@/lib/api/apiClient";
import { Icon } from "@/components/Icon";

interface DiscoverClientProps {
    allStudents: StudentData[];
    allInterests: InterestWithCategory[];
    allCategories: InterestCategoryData[];
    lookingForOptions: LookingForOptionData[];
}

interface MatchResult {
    studentId: string;
    studentName: string;
    studentFaculty: string;
    studentProgram: string;
    studentYear: number;
    studentBio: string | null;
    commonInterests: { id: string, name: string, icon: string }[];
    matchPercentage: number;
    totalUniqueInterests: number;
}

const MatchRing = ({ percentage }: { percentage: number }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isHigh = percentage >= 75;
    const color = isHigh ? "text-primary" : (percentage >= 40 ? "text-ring" : "text-outline-variant");
    const gradient = isHigh ? "stroke-[url(#orangeGradient)]" : "";

    return (
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                <defs>
                    <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className="text-primary" stopColor="currentColor" />
                        <stop offset="100%" className="text-ring" stopColor="currentColor" />
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r={radius} className="fill-transparent stroke-muted" strokeWidth="4" />
                <circle
                    cx="20" cy="20" r={radius}
                    className={`fill-transparent transition-all duration-1000 ease-out ${color} ${gradient}`}
                    stroke={isHigh ? "url(#orangeGradient)" : "currentColor"}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-xs font-bold text-foreground tabular-nums">{percentage}%</span>
        </div>
    );
};

export function DiscoverClient({
    allStudents,
    allInterests,
    allCategories,
    lookingForOptions,
}: DiscoverClientProps) {
    const { user } = useAuth();
    const currentStudent = user?.studentId ? allStudents.find((s) => s.studentId === String(user.studentId) || s.id === String(user.studentId)) : null;

    const [search, setSearch] = useState("");
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedLookingFor, setSelectedLookingFor] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    useEffect(() => {
        if (!currentStudent) {
            setLoadingMatches(false);
            return;
        }

        const fetchMatches = async () => {
            try {
                setMatches(await fetchJsonWithAuth(`/students/${currentStudent.id}/matches`));
            } catch (e) {
                console.error("Match engine failed", e);
            } finally {
                setLoadingMatches(false);
            }
        };

        fetchMatches();
    }, [currentStudent]);

    const getInterestsByIds = useCallback((ids: string[]) => allInterests.filter((i) => ids.includes(i.id)), [allInterests]);

    const exploreDirectory = useMemo(() => {
        const searchLower = search.toLowerCase().trim();
        return allStudents
            .filter((s) => s.id !== currentStudent?.id)
            .filter((s) => {
                if (searchLower) {
                    const nameMatch = s.name.toLowerCase().includes(searchLower);
                    const interestMatch = getInterestsByIds(s.interestIds).some((i) => i.name.toLowerCase().includes(searchLower));
                    if (!nameMatch && !interestMatch) return false;
                }
                if (selectedYear && s.year !== parseInt(selectedYear)) return false;
                if (selectedLookingFor && !s.lookingForIds.includes(selectedLookingFor)) return false;
                if (selectedInterests.length > 0 && !selectedInterests.some((id) => s.interestIds.includes(id))) return false;
                return true;
            });
    }, [allStudents, currentStudent, search, selectedInterests, selectedYear, selectedLookingFor, getInterestsByIds]);

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    };

    const clearFilters = () => {
        setSearch(""); setSelectedInterests([]); setSelectedYear(""); setSelectedLookingFor("");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2"><Icon name="users" className="h-7 w-7 text-primary" /> ค้นหาเพื่อนที่ใช่</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                        ค้นหาเพื่อนที่มีความสนใจคล้ายกัน หรือเลือกดูรายชื่อนักศึกษาทั้งหมด ระบบจับคู่ด้วยอัลกอริทึม Jaccard
                    </p>
                </div>
                <Link href="/profile" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-gradient text-white font-medium rounded-xl hover:shadow-md hover:scale-[1.02] transition-all text-sm border-transparent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Icon name="target" className="h-5 w-5" /> เพิ่มความสนใจเพื่อจับคู่
                </Link>
            </div>

            {/* Premium Matches Section */}
            {!search && selectedInterests.length === 0 && !selectedYear && !selectedLookingFor && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-primary"><Icon name="sparkles" className="h-6 w-6" /></span>
                        <h2 className="text-xl font-bold">เพื่อนที่เข้ากับคุณที่สุด</h2>
                    </div>

                    {loadingMatches ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse border border-border"></div>
                            ))}
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10 text-center">
                            <span className="flex justify-center mb-3 text-primary"><Icon name="users" className="h-10 w-10" /></span>
                            <h3 className="font-semibold text-lg text-foreground">ยังไม่มีเพื่อนที่เข้ากับคุณ</h3>
                            {currentStudent && currentStudent.interestIds.length > 0 ? (
                                <>
                                    <p className="text-sm text-muted-foreground mt-2 mb-5">ยังไม่มีใครสนใจเรื่องเดียวกับคุณ — ลองเพิ่มความสนใจให้หลากหลายขึ้น หรือรอเพื่อน ๆ เข้ามาเลือก</p>
                                    <Link href="/profile" className="text-sm text-primary font-medium hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">เพิ่มความสนใจ →</Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground mt-2 mb-5">เพิ่มความสนใจในโปรไฟล์ก่อน ระบบจะจับคู่คุณกับเพื่อนที่สนใจเหมือนกัน</p>
                                    <Link href="/profile" className="text-sm text-primary font-medium hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">ไปที่โปรไฟล์ →</Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {matches.map((match) => (
                                <Link key={match.studentId} href={`/students/${match.studentId}`} className="group relative bg-card rounded-3xl border border-border p-5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-inner">
                                            {getInitials(match.studentName)}
                                        </div>
                                        <MatchRing percentage={match.matchPercentage} />
                                    </div>
                                    <h3 className="font-bold text-foreground line-clamp-1">{match.studentName}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">{match.studentFaculty} · {match.studentProgram}</p>
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {match.commonInterests.slice(0, 3).map((i) => (
                                            <span key={i.id} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium whitespace-nowrap">
                                                {i.icon} {i.name}
                                            </span>
                                        ))}
                                        {match.commonInterests.length > 3 && (
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">+{match.commonInterests.length - 3}</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Explore Directory Section */}
            <section className="space-y-6 pt-6 border-t border-dashed border-border">
                <div className="flex items-center gap-3">
                    <span className="text-primary"><Icon name="globe" className="h-6 w-6" /></span>
                    <h2 className="text-xl font-bold">รายชื่อนักศึกษา</h2>
                </div>

                <div className="bg-card rounded-2xl border border-border p-2 flex items-center justify-between shadow-sm p-4">
                    <div className="flex gap-3 w-full">
                        <input
                            type="text"
                            placeholder="ค้นหาด้วยชื่อ คณะ หรือความสนใจ..."
                            aria-label="ค้นหานักศึกษา"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary text-sm transition-all"
                        />
                        <button onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0 px-5 py-3 rounded-xl border text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${showFilters ? "bg-primary text-white border-primary" : "bg-card text-foreground hover:bg-muted"}`}>
                            <Icon name="filter" className="h-4 w-4" />
                            ตัวกรอง {selectedInterests.length > 0 && <span className="bg-primary text-white text-xs tabular-nums w-5 h-5 flex items-center justify-center rounded-full ml-1">{selectedInterests.length}</span>}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-in slide-in-from-top-4 duration-300 fade-in">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-foreground mb-3 block">ชั้นปี</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {["", "1", "2", "3", "4"].map((y) => (
                                            <button key={y} onClick={() => setSelectedYear(y)} className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${selectedYear === y ? "bg-primary text-white border-primary shadow-md" : "bg-card text-muted-foreground hover:bg-accent"}`}>
                                                {y ? `ปี ${y}` : "ทุกชั้นปี"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-foreground mb-3 block">กำลังมองหา</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setSelectedLookingFor("")} className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${!selectedLookingFor ? "bg-primary text-white border-primary shadow-md" : "bg-card text-muted-foreground hover:bg-accent"}`}>
                                            อะไรก็ได้
                                        </button>
                                        {lookingForOptions.map((lf) => (
                                            <button key={lf.id} onClick={() => setSelectedLookingFor(lf.id === selectedLookingFor ? "" : lf.id)} className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${selectedLookingFor === lf.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground hover:bg-accent"}`}>
                                                {lf.icon} {lf.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-foreground mb-3 block">กรองตามหมวดหมู่</label>
                                <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                    {allCategories.map((cat) => (
                                        <div key={cat.id} className="bg-muted rounded-xl p-3 border border-border">
                                            <p className="text-xs font-bold text-foreground mb-2">{cat.icon} {cat.name}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {allInterests.filter((i) => i.categoryId === cat.id).map((interest) => (
                                                    <button key={interest.id} onClick={() => toggleInterest(interest.id)} className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedInterests.includes(interest.id) ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-input"}`}>
                                                        {interest.icon} {interest.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">พบนักศึกษา <span className="tabular-nums">{exploreDirectory.length}</span> คน</p>
                    {(search || selectedInterests.length > 0 || selectedYear || selectedLookingFor) && (
                        <button onClick={clearFilters} className="text-xs font-bold text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">ล้างตัวกรองทั้งหมด</button>
                    )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {exploreDirectory.map((student) => {
                        const studentInterests = getInterestsByIds(student.interestIds).slice(0, 3);
                        return (
                            <Link key={student.id} href={`/students/${student.id}`} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-blue-300 transition-all block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold shrink-0 group-hover:bg-accent group-hover:text-primary transition-colors">
                                        {getInitials(student.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{student.name}</h3>
                                        <p className="text-xs text-muted-foreground flex justify-between font-medium mt-0.5"><span>ปี {student.year}</span></p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5">
                                    {studentInterests.length === 0 && <span className="text-xs text-outline italic">ยังไม่ได้แสดงความสนใจ</span>}
                                    {studentInterests.map((interest) => (
                                        <span key={interest.id} className="text-xs px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground font-medium">
                                            {interest.icon} {interest.name}
                                        </span>
                                    ))}
                                    {student.interestIds.length > 3 && (
                                        <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-bold">+{student.interestIds.length - 3}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {exploreDirectory.length === 0 && (
                    <div className="text-center py-20 bg-muted rounded-3xl border border-dashed border-border">
                        <span className="flex justify-center mb-4 text-outline"><Icon name="search" className="h-12 w-12" /></span>
                        <h3 className="font-bold text-lg text-foreground">ไม่พบนักศึกษา</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">ลองปรับตัวกรอง เลือกความสนใจอื่น หรือล้างคำค้นหาแล้วลองใหม่อีกครั้ง</p>
                        <button onClick={clearFilters} className="mt-5 px-6 py-2 bg-card border border-border rounded-xl font-medium shadow-sm hover:shadow text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">ล้างตัวกรอง</button>
                    </div>
                )}
            </section>
        </div>
    );
}
