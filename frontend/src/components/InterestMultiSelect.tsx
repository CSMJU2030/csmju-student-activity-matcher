"use client";

import { useState } from "react";
import { InterestWithCategory } from "@/lib/data/interests";

/** Pick up to `max` interests (for a group / activity), with search. */
export function InterestMultiSelect({
    allInterests,
    value,
    onChange,
    max = 10,
}: {
    allInterests: InterestWithCategory[];
    value: string[];
    onChange: (ids: string[]) => void;
    max?: number;
}) {
    const [search, setSearch] = useState("");
    const q = search.trim().toLowerCase();
    const selected = value.map((id) => allInterests.find((i) => i.id === id)).filter((i): i is InterestWithCategory => !!i);
    const options = allInterests.filter((i) => !value.includes(i.id) && (!q || i.name.toLowerCase().includes(q)));

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {selected.length === 0 && <span className="text-xs text-muted-foreground italic">ยังไม่ได้เลือก</span>}
                {selected.map((i) => (
                    <button type="button" key={i.id} onClick={() => onChange(value.filter((x) => x !== i.id))}
                        className="px-3 py-1 rounded-full text-xs bg-primary text-white hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        {i.icon} {i.name} ×
                    </button>
                ))}
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา interest เพื่อเพิ่ม..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {options.slice(0, 60).map((i) => (
                    <button type="button" key={i.id} disabled={value.length >= max} onClick={() => onChange([...value, i.id])}
                        className="px-2.5 py-1 rounded-full text-xs bg-accent hover:bg-primary/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        {i.icon} {i.name}
                    </button>
                ))}
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">เลือกได้สูงสุด {max} อย่าง ({value.length}/{max})</p>
        </div>
    );
}
