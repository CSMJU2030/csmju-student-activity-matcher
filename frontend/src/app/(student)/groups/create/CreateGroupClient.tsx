"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createGroup } from "@/lib/actions";
import { Icon } from "@/components/Icon";
import { InterestWithCategory, InterestCategoryData } from "@/lib/data/interests";

export function CreateGroupClient({
    allInterests,
    categories
}: {
    allInterests: InterestWithCategory[],
    categories: InterestCategoryData[]
}) {
    const { user } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
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
        if (!name.trim()) { setError("กรุณากรอกชื่อกลุ่ม"); return; }
        if (!description.trim()) { setError("กรุณากรอกรายละเอียด"); return; }
        if (selectedInterests.length === 0) { setError("กรุณาเลือกความสนใจอย่างน้อย 1 รายการ"); return; }

        if (!user?.studentId) { setError("ไม่พบผู้ใช้งาน"); return; }

        setIsPending(true);
        const res = await createGroup(user.studentId, {
            name,
            description,
            coverImage: "",
            interestIds: selectedInterests,
        });

        if (res.success && res.groupId) {
            router.push(`/groups/${res.groupId}`);
            router.refresh();
        } else {
            setError(res.error || "เกิดข้อผิดพลาดในการสร้างกลุ่ม");
            setIsPending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold inline-flex items-center gap-2"><Icon name="sparkles" className="h-6 w-6 text-primary" /> สร้างกลุ่มใหม่</h1>
                <p className="text-muted-foreground mt-1">สร้างกลุ่มเพื่อรวมคนที่มีความสนใจเหมือนกัน</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-6">
                {error && (
                    <div role="alert" className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2">ชื่อกลุ่ม *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="เช่น ชมรมบอร์ดเกม MJU"
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">รายละเอียด *</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="อธิบายเกี่ยวกับกลุ่ม..."
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-3">ความสนใจที่เกี่ยวข้อง *</label>
                    {categories.map((cat) => (
                        <div key={cat.id} className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1.5">{cat.icon} {cat.name}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {allInterests.filter((i) => i.categoryId === cat.id).map((interest) => (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selectedInterests.includes(interest.id)
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

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isPending}
                        className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 shadow-md shadow-primary/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        {isPending ? "กำลังสร้าง..." : "สร้างกลุ่ม"}
                    </button>
                </div>
            </form>
        </div>
    );
}
