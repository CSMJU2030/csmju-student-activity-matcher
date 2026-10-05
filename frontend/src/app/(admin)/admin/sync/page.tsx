import { SyncClient } from "./SyncClient";
import { fetchJsonWithAuth } from "@/lib/api/apiClient";

export default async function SyncPage() {
    let logs: any[] = [];
    try {
        logs = await fetchJsonWithAuth("/admin/sync-reg/logs");
    } catch { }
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ซิงก์ข้อมูล REG</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    ดึงข้อมูลนักศึกษาล่าสุดจากระบบลงทะเบียนเรียน (REST API)
                </p>
            </div>

            <SyncClient logs={logs} />
        </div>
    );
}
