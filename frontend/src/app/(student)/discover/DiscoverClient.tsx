"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { InterestWithCategory, InterestCategoryData, LookingForOptionData } from "@/lib/data/interests";
import { StudentData } from "@/lib/data/students";
import { getInitials } from "@/lib/utils";
import { fetchJsonWithAuth } from "@/lib/api/apiClient";

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
    const color = isHigh ? "text-orange-500" : (percentage >= 40 ? "text-blue-500" : "text-slate-300");
    const gradient = isHigh ? "stroke-[url(#orangeGradient)]" : "";

    return (
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                <defs>
                    <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className="text-orange-500" stopColor="currentColor" />
                        <stop offset="100%" className="text-red-500" stopColor="currentColor" />
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r={radius} className="fill-transparent stroke-slate-100" strokeWidth="4" />
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
            <span className="absolute text-[11px] font-bold text-slate-700">{percentage}%</span>
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
                    <h1 className="text-3xl font-extrabold tracking-tight">👥 Discover Matches</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                        Find students with similar interests or browse the directory. Powered by our native Jaccard matching algorithm.
                    </p>
                </div>
                <Link href="/profile" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-md hover:scale-[1.02] transition-all text-sm border-transparent shadow-sm">
                    <span className="text-lg">🎯</span> Add Interests to Match
                </Link>
            </div>

            {/* Premium Matches Section */}
            {!search && selectedInterests.length === 0 && !selectedYear && !selectedLookingFor && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔥</span>
                        <h2 className="text-xl font-bold">Your Top Matches</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider ml-2 border border-primary/20">NestJS Engine</span>
                    </div>

                    {loadingMatches ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse border border-slate-200"></div>
                            ))}
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-3xl p-10 text-center">
                            <span className="text-4xl block mb-3">🧩</span>
                            <h3 className="font-semibold text-lg text-slate-800">No Matches Yet</h3>
                            {currentStudent && currentStudent.interestIds.length > 0 ? (
                                <>
                                    <p className="text-sm text-slate-500 mt-2 mb-5">ยังไม่มีใครสนใจเรื่องเดียวกับคุณ — ลองเพิ่มความสนใจให้หลากหลายขึ้น หรือรอเพื่อน ๆ เข้ามาเลือก</p>
                                    <Link href="/profile" className="text-sm text-primary font-medium hover:underline">เพิ่มความสนใจ →</Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-500 mt-2 mb-5">เพิ่มความสนใจในโปรไฟล์ก่อน ระบบจะจับคู่คุณกับเพื่อนที่สนใจเหมือนกัน</p>
                                    <Link href="/profile" className="text-sm text-primary font-medium hover:underline">ไปที่โปรไฟล์ →</Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {matches.map((match) => (
                                <Link key={match.studentId} href={`/students/${match.studentId}`} className="group relative bg-white rounded-3xl border border-slate-200 p-5 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all block overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-rose-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-lg shadow-inner">
                                            {getInitials(match.studentName)}
                                        </div>
                                        <MatchRing percentage={match.matchPercentage} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 line-clamp-1">{match.studentName}</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">{match.studentFaculty} · {match.studentProgram}</p>
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {match.commonInterests.slice(0, 3).map((i) => (
                                            <span key={i.id} className="text-[11px] px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 font-medium whitespace-nowrap">
                                                {i.icon} {i.name}
                                            </span>
                                        ))}
                                        {match.commonInterests.length > 3 && (
                                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">+{match.commonInterests.length - 3}</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Explore Directory Section */}
            <section className="space-y-6 pt-6 border-t border-dashed border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌍</span>
                    <h2 className="text-xl font-bold">Explore Directory</h2>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-between shadow-sm p-4">
                    <div className="flex gap-3 w-full">
                        <input
                            type="text"
                            placeholder="Search by name, faculties, or specific interests..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all"
                        />
                        <button onClick={() => setShowFilters(!showFilters)} className={`shrink-0 px-5 py-3 rounded-xl border text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${showFilters ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-700 hover:bg-slate-50"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            Filters {selectedInterests.length > 0 && <span className="bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1">{selectedInterests.length}</span>}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in slide-in-from-top-4 duration-300 fade-in">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-slate-800 mb-3 block">Academic Year</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {["", "1", "2", "3", "4"].map((y) => (
                                            <button key={y} onClick={() => setSelectedYear(y)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${selectedYear === y ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                                                {y ? `Year ${y}` : "All Years"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-800 mb-3 block">Looking For</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setSelectedLookingFor("")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${!selectedLookingFor ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                                            Anything
                                        </button>
                                        {lookingForOptions.map((lf) => (
                                            <button key={lf.id} onClick={() => setSelectedLookingFor(lf.id === selectedLookingFor ? "" : lf.id)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${selectedLookingFor === lf.id ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                                                {lf.icon} {lf.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-800 mb-3 block">Filter by Categories</label>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {allCategories.map((cat) => (
                                        <div key={cat.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-700 mb-2">{cat.icon} {cat.name}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {allInterests.filter((i) => i.categoryId === cat.id).map((interest) => (
                                                    <button key={interest.id} onClick={() => toggleInterest(interest.id)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedInterests.includes(interest.id) ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
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
                    <p className="text-sm font-medium text-slate-500">Found {exploreDirectory.length} students</p>
                    {(search || selectedInterests.length > 0 || selectedYear || selectedLookingFor) && (
                        <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:underline">Clear all filters</button>
                    )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {exploreDirectory.map((student) => {
                        const studentInterests = getInterestsByIds(student.interestIds).slice(0, 3);
                        return (
                            <Link key={student.id} href={`/students/${student.id}`} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all block group">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        {getInitials(student.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{student.name}</h3>
                                        <p className="text-[11px] text-slate-500 flex justify-between uppercase font-medium mt-0.5"><span>Year {student.year}</span></p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                                    {studentInterests.length === 0 && <span className="text-xs text-slate-400 italic">No public interests</span>}
                                    {studentInterests.map((interest) => (
                                        <span key={interest.id} className="text-[11px] px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                                            {interest.icon} {interest.name}
                                        </span>
                                    ))}
                                    {student.interestIds.length > 3 && (
                                        <span className="text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-500 font-bold">+{student.interestIds.length - 3}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {exploreDirectory.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <span className="text-5xl block mb-4 opacity-50">🧭</span>
                        <h3 className="font-bold text-lg text-slate-700">No students found</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Try adjusting your filters, selecting different interests, or clearing your search query.</p>
                        <button onClick={clearFilters} className="mt-5 px-6 py-2 bg-white border border-slate-200 rounded-xl font-medium shadow-sm hover:shadow text-sm transition-all">Clear Filters</button>
                    </div>
                )}
            </section>
        </div>
    );
}
