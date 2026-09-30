"use client";

import { useState } from "react";

interface SyncLogData {
    id: string;
    source: string;
    faculty: string;
    program: string;
    fetched: number;
    inserted: number;
    updated: number;
    skipped: number;
    failed: number;
    status: string;
    createdAt: Date;
}

interface SyncClientProps {
    logs: SyncLogData[];
}

export function SyncClient({ logs }: SyncClientProps) {
    const [entryYear, setEntryYear] = useState("2567");
    const [isSyncing, setIsSyncing] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; count?: number; skipped?: number; message?: string, error?: string } | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setResult(null);

        try {
            const res = await fetch("/api/admin/sync-reg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entryYear })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to sync data");
            }

            setResult(data);

            // Reload the page to fetch new logs if successful
            window.location.reload();
        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 space-y-6">
            <div className="bg-card rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-background/50">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Sync Student Directory</h1>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-2xl">
                        Synchronize official student records from the university registry. This process imports new students and updates existing profiles without overwriting personal settings or group associations.
                    </p>
                </div>

                <div className="p-8">
                    <div className="mb-8 p-5 bg-blue-50/80 border border-primary/20 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                        <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            Automated Data Scope
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                            <div>
                                <span className="block text-primary font-medium mb-1 text-xs uppercase tracking-wider">Data Source</span>
                                <span className="font-semibold text-primary">Maejo REG (edu.mju.ac.th)</span>
                            </div>
                            <div>
                                <span className="block text-primary font-medium mb-1 text-xs uppercase tracking-wider">Faculty Filter</span>
                                <span className="font-semibold text-primary text-base">วิทยาศาสตร์</span>
                            </div>
                            <div>
                                <span className="block text-primary font-medium mb-1 text-xs uppercase tracking-wider">Program Filter</span>
                                <span className="font-semibold text-primary text-base">วิทยาการคอมพิวเตอร์</span>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-primary border-t border-primary/20 pt-3">
                            All incoming records undergo server-side validation. Any students from outside this faculty or program will be strictly skipped.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid gap-3">
                            <label htmlFor="entryYear" className="text-sm font-medium text-slate-700">
                                Admission Year (ปีการศึกษาที่เข้าศึกษา)
                            </label>
                            <div className="flex gap-4">
                                <select
                                    id="entryYear"
                                    value={entryYear}
                                    onChange={(e) => setEntryYear(e.target.value)}
                                    className="flex-1 bg-card border border-slate-300 rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-primary transition-all outline-none"
                                    disabled={isSyncing}
                                >
                                    <option value="2567">2567 (Freshmen)</option>
                                    <option value="2566">2566 (Sophomore)</option>
                                    <option value="2565">2565 (Junior)</option>
                                    <option value="2564">2564 (Senior)</option>
                                    <option value="2563">2563 (Super Senior)</option>
                                </select>

                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className={`
                    px-8 py-2.5 rounded-lg font-medium text-sm text-white transition-all
                    flex items-center gap-2 justify-center min-w-[140px]
                    ${isSyncing
                                            ? 'bg-slate-400 cursor-not-allowed'
                                            : 'bg-foreground hover:bg-slate-800 shadow-sm hover:shadow active:scale-[0.98]'
                                        }
                  `}
                                >
                                    {isSyncing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.5l5.8 5.8" /></svg>
                                            Start Sync
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Results Feedback */}
                        {result && (
                            <div aria-live="polite" className={`mt-8 p-5 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-300 ${result.error
                                ? 'bg-red-50/50 border-primary/20 text-primary'
                                : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                                }`}>
                                {result.error ? (
                                    <div className="flex gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        <div>
                                            <h4 className="font-semibold text-sm">Synchronization Failed</h4>
                                            <p className="text-sm mt-1 opacity-90">{result.error}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        <div className="w-full">
                                            <h4 className="font-semibold text-sm">Sync Completed Successfully</h4>

                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div className="bg-card/60 p-4 rounded-lg border border-emerald-100/50 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-bold text-emerald-600 mb-1">{result.count || 0}</span>
                                                    <span className="text-xs font-medium text-emerald-800/70 uppercase tracking-widest">Added / Updated</span>
                                                </div>
                                                <div className="bg-card/60 p-4 rounded-lg border border-emerald-100/50 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-bold text-slate-400 mb-1">{result.skipped || 0}</span>
                                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Filtered Out</span>
                                                </div>
                                            </div>

                                            <p className="text-xs mt-4 text-emerald-800/60">
                                                {result.message}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-background flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Sync History</h2>
                    <span className="bg-secondary text-primary py-1 px-3 rounded-full text-xs font-bold uppercase">
                        PostgreSQL
                    </span>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm text-left align-middle">
                        <thead className="bg-background text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Time (Recent)</th>
                                <th className="px-6 py-3 font-medium">Source</th>
                                <th className="px-6 py-3 font-medium">Scope</th>
                                <th className="px-6 py-3 font-medium text-center">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                                        ยังไม่มีประวัติการซิงค์ข้อมูล
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-background/50 transition-colors">
                                    <td className="px-6 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-3 font-medium text-slate-700">{log.source}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-xs text-slate-500">
                                            {log.faculty} / {log.program}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-primary'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <span className="text-xs text-slate-500 font-medium" title="Fetched/Inserted">
                                                F:{log.fetched} I:{log.inserted}
                                            </span>
                                            <span className="text-xs text-slate-400">|</span>
                                            <span className="text-xs text-slate-500 font-medium" title="Skipped/Failed">
                                                S:{log.skipped} E:{log.failed}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
