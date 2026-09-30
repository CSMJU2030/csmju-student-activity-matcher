import SyncClient from "./SyncClient";

export default async function SyncPage() {
    const logs: any[] = []; // Migrated to backend API
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Sync Data (REG)</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    ดึงข้อมูลนักศึกษาล่าสุดจากระบบลงทะเบียนเรียน (REST API)
                </p>
            </div>

            <SyncClient initialLogs={logs} />
        </div>
    );
}
