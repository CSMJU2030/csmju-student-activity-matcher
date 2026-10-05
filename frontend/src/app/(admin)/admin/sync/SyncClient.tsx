"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api/apiClient";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

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

/**
 * Admission years still studying, newest first, labelled with their class year.
 * The Thai academic year (B.E.) starts in June - same rule as the backend's
 * classYearFromEntryYear.
 */
function admissionYears(now = new Date()) {
    const academicYear = now.getFullYear() + 543 - (now.getMonth() < 5 ? 1 : 0);
    return [0, 1, 2, 3, 4].map((i) => ({ value: String(academicYear - i), classYear: i + 1 }));
}

export function SyncClient({ logs }: SyncClientProps) {
    const router = useRouter();
    const years = admissionYears();
    const [entryYear, setEntryYear] = useState(years[0].value);
    const [isSyncing, setIsSyncing] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; count?: number; skipped?: number; message?: string, error?: string } | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setResult(null);

        try {
            const res = await apiSend<{ success: boolean; count: number; skipped: number; message: string }>(
                "POST", "/admin/sync-reg", { entryYear },
            );
            if (!res.success) throw new Error(res.error);

            setResult(res.data);
            // Re-fetch the server-rendered sync logs, keeping the result message on screen
            router.refresh();
        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 space-y-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-8 border-b border-border bg-background/50">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">ซิงก์รายชื่อนักศึกษา</h1>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-2xl">
                        ดึงข้อมูลนักศึกษาจากระบบทะเบียนของมหาวิทยาลัย ระบบจะเพิ่มนักศึกษาใหม่และอัปเดตข้อมูลเดิม โดยไม่เขียนทับการตั้งค่าส่วนตัวหรือกลุ่มที่นักศึกษาเข้าร่วม
                    </p>
                </div>

                <div className="p-8">
                    <div className="mb-8 p-5 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                        <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                            <Icon name="info" className="h-4 w-4 text-primary" />
                            ขอบเขตข้อมูลที่ซิงก์
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                            <div>
                                <span className="block text-primary font-medium mb-1 text-xs">แหล่งข้อมูล</span>
                                <span className="font-semibold text-primary">Maejo REG (edu.mju.ac.th)</span>
                            </div>
                            <div>
                                <span className="block text-primary font-medium mb-1 text-xs">คณะที่ซิงก์</span>
                                <span className="font-semibold text-primary text-base">วิทยาศาสตร์</span>
                            </div>
                            <div>
                                <span className="block text-primary font-medium mb-1 text-xs">สาขาที่ซิงก์</span>
                                <span className="font-semibold text-primary text-base">วิทยาการคอมพิวเตอร์</span>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-primary border-t border-primary/20 pt-3">
                            ข้อมูลที่ดึงมาทั้งหมดจะถูกตรวจสอบที่เซิร์ฟเวอร์ นักศึกษาที่ไม่ได้อยู่ในคณะหรือสาขานี้จะถูกข้ามทั้งหมด
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid gap-3">
                            <label htmlFor="entryYear" className="text-sm font-medium text-foreground">
                                ปีการศึกษาที่เข้าศึกษา
                            </label>
                            <div className="flex gap-4">
                                <select
                                    id="entryYear"
                                    value={entryYear}
                                    onChange={(e) => setEntryYear(e.target.value)}
                                    className="flex-1 bg-card border border-input rounded-lg px-4 py-2.5 text-foreground text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    disabled={isSyncing}
                                >
                                    {years.map((y) => (
                                        <option key={y.value} value={y.value}>
                                            {y.value} (ปี {y.classYear}{y.classYear > 4 ? " ขึ้นไป" : ""})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className={`
                    px-8 py-2.5 rounded-lg font-medium text-sm text-white transition-all
                    flex items-center gap-2 justify-center min-w-[140px]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${isSyncing
                                            ? 'bg-outline cursor-not-allowed'
                                            : 'bg-foreground hover:bg-foreground/90 shadow-sm hover:shadow active:scale-[0.98]'
                                        }
                  `}
                                >
                                    {isSyncing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            กำลังซิงก์...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="refresh" className="h-4 w-4" />
                                            เริ่มซิงก์
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Results Feedback */}
                        {result && (
                            <div aria-live="polite" className={`mt-8 p-5 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-300 ${result.error
                                ? 'bg-error-container/50 border-error/30 text-on-error-container'
                                : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                                }`}>
                                {result.error ? (
                                    <div className="flex gap-3">
                                        <Icon name="alert" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-sm">ซิงก์ข้อมูลไม่สำเร็จ</h4>
                                            <p className="text-sm mt-1 opacity-90">{result.error}</p>
                                            <p className="text-xs mt-1 opacity-80">กรุณาตรวจสอบการเชื่อมต่อแล้วกดเริ่มซิงก์อีกครั้ง</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <Icon name="check" className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <div className="w-full">
                                            <h4 className="font-semibold text-sm">ซิงก์ข้อมูลสำเร็จ</h4>

                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div className="bg-card/60 p-4 rounded-lg border border-emerald-100/50 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-bold text-emerald-600 mb-1 tabular-nums">{result.count || 0}</span>
                                                    <span className="text-xs font-medium text-emerald-800/70">เพิ่ม / อัปเดต</span>
                                                </div>
                                                <div className="bg-card/60 p-4 rounded-lg border border-emerald-100/50 flex flex-col items-center justify-center">
                                                    <span className="text-2xl font-bold text-outline mb-1 tabular-nums">{result.skipped || 0}</span>
                                                    <span className="text-xs font-medium text-muted-foreground">ถูกข้าม</span>
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

            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-background flex items-center justify-between">
                    <h2 className="font-bold text-foreground">ประวัติการซิงก์</h2>
                    <span className="bg-secondary text-primary py-1 px-3 rounded-full text-xs font-bold">
                        PostgreSQL
                    </span>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm text-left align-middle">
                        <thead className="bg-background text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-medium">เวลา (ล่าสุด)</th>
                                <th className="px-6 py-3 font-medium">แหล่งข้อมูล</th>
                                <th className="px-6 py-3 font-medium">ขอบเขต</th>
                                <th className="px-6 py-3 font-medium text-center">สถานะ</th>
                                <th className="px-6 py-3 font-medium text-right">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                                        ยังไม่มีประวัติการซิงก์ข้อมูล กดปุ่ม &ldquo;เริ่มซิงก์&rdquo; เพื่อเริ่มต้น
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-background/50 transition-colors">
                                    <td className="px-6 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="px-6 py-3 font-medium text-foreground">{log.source}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-xs text-muted-foreground">
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
                                            <span className="text-xs text-muted-foreground font-medium tabular-nums" title="ดึงมา / เพิ่มใหม่">
                                                F:{log.fetched} I:{log.inserted}
                                            </span>
                                            <span className="text-xs text-outline">|</span>
                                            <span className="text-xs text-muted-foreground font-medium tabular-nums" title="ข้าม / ผิดพลาด">
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
