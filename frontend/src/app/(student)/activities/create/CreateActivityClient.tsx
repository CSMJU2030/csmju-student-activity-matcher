"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createActivityFn } from "@/lib/api/activities";
import { InterestCategoryData, InterestWithCategory } from "@/lib/data/interests";

export function CreateActivityClient({
    allInterests,
    categories
}: {
    allInterests: InterestWithCategory[],
    categories: InterestCategoryData[]
}) {
    const { user, token } = useAuth(); // Assume token is retrieved from SSO integration
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [capacity, setCapacity] = useState("10");
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [isPending, setIsPending] = useState(false);

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError("กรุณากรอกชื่อ Activity"); return; }
        if (!description.trim()) { setError("กรุณากรอกรายละเอียด"); return; }
        if (!date) { setError("กรุณาเลือกวันที่"); return; }
        if (!time) { setError("กรุณาเลือกเวลา"); return; }
        if (!location.trim()) { setError("กรุณากรอกสถานที่"); return; }
        if (!user?.studentId) { setError("ไม่พบผู้ใช้งาน"); return; }
        if (!token) { setError("กรุณาเข้าสู่ระบบ (Authentication token missing)"); return; }

        setIsPending(true);

        try {
            const result = await createActivityFn(token, {
                title,
                description,
                date,
                time,
                location,
                capacity: parseInt(capacity) || 10,
                coverImage: "",
                interestIds: selectedInterests,
            });

            alert("สร้าง Activity สำเร็จ!");
            router.push(`/activities/${result.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "ไม่สามารถสร้างกิจกรรมได้");
            setIsPending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">✨ สร้าง Activity ใหม่</h1>
                <p className="text-muted-foreground mt-1">สร้างกิจกรรมเพื่อชวนคนมาร่วม</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-5">
                {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

                <div>
                    <label className="block text-sm font-medium mb-2">ชื่อ Activity *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Valorant Night"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">รายละเอียด *</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="อธิบายเกี่ยวกับกิจกรรม..."
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">วันที่ *</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">เวลา *</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">สถานที่ *</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. ห้อง Lab 3 อาคาร IT"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">จำนวนคนสูงสุด</label>
                    <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="2" max="100"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-3">Related Interests</label>
                    {categories.map((cat) => (
                        <div key={cat.id} className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1.5">{cat.icon} {cat.name}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {allInterests.filter((i) => i.categoryId === cat.id).map((interest) => (
                                    <button key={interest.id} type="button" onClick={() => toggleInterest(interest.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${selectedInterests.includes(interest.id) ? "bg-primary text-white" : "bg-accent hover:bg-accent/80"
                                            }`}>
                                        {interest.icon} {interest.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 pt-4">
                    <button type="button" disabled={isPending} onClick={() => router.back()} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent disabled:opacity-50">ยกเลิก</button>
                    <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 shadow-md shadow-primary/20 disabled:opacity-50">
                        {isPending ? "กำลังสร้าง..." : "สร้าง Activity"}
                    </button>
                </div>
            </form>
        </div>
    );
}
