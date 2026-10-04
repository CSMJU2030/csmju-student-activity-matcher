"use client";

import { useState } from "react";
import { InterestCategoryData, InterestWithCategory } from "@/lib/data/interests";

interface InterestPickerProps {
    allInterests: InterestWithCategory[];
    categories: InterestCategoryData[];
    selectedIds: string[];
    disabled?: boolean;
    onAdd: (interestId: string) => void;
    /** Create a new interest in a category (e.g. a game that is not listed yet). */
    onCreate: (name: string, categoryId: string) => Promise<void>;
}

/**
 * Search + category tabs + "add a new one to this category".
 * Shared by the student profile and the admin student editor.
 */
export function InterestPicker({ allInterests, categories, selectedIds, disabled, onAdd, onCreate }: InterestPickerProps) {
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [newName, setNewName] = useState("");
    const [newCategoryId, setNewCategoryId] = useState("");

    const q = search.trim().toLowerCase();
    const available = allInterests.filter(
        (i) =>
            !selectedIds.includes(i.id) &&
            (categoryId === "all" || i.categoryId === categoryId) &&
            (!q || i.name.toLowerCase().includes(q)),
    );
    const activeCategory = categories.find((c) => c.id === categoryId);
    const exactExists = (name: string) => allInterests.some((i) => i.name.toLowerCase() === name.trim().toLowerCase());

    // The "add new" form: pre-filled from the search box, in the selected category.
    const draftName = newName || search.trim();
    const draftCategory = activeCategory?.id ?? newCategoryId;
    const canCreate = draftName.length >= 2 && !!draftCategory && !exactExists(draftName);

    const create = async () => {
        if (!canCreate) return;
        await onCreate(draftName.trim(), draftCategory);
        setNewName("");
        setSearch("");
    };

    return (
        <div className="space-y-3">
            <input
                type="text"
                placeholder="ค้นหา interest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setCategoryId("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${categoryId === "all" ? "bg-primary text-white" : "bg-accent"}`}
                >
                    ทั้งหมด
                </button>
                {categories.map((cat) => (
                    <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategoryId(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${categoryId === cat.id ? "bg-primary text-white" : "bg-accent"}`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {available.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">ไม่พบ{q ? ` "${search.trim()}"` : ""} — เพิ่มใหม่ได้ด้านล่าง</p>
                )}
                {available.map((interest) => (
                    <button
                        type="button"
                        key={interest.id}
                        onClick={() => onAdd(interest.id)}
                        disabled={disabled}
                        className="px-3 py-1.5 rounded-full text-xs bg-accent hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                    >
                        {interest.icon} {interest.name}
                    </button>
                ))}
            </div>

            {/* Add a missing one, e.g. a game that is not in "Games" yet */}
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-medium text-primary">
                    ➕ ไม่เจอที่ต้องการ? เพิ่มใหม่{activeCategory ? ` ในหมวด ${activeCategory.icon} ${activeCategory.name}` : ""}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={newName || search}
                        onChange={(e) => setNewName(e.target.value)}
                        maxLength={50}
                        placeholder={activeCategory ? `ชื่อ${activeCategory.name === "Games" ? "เกม" : ""}ที่ต้องการเพิ่ม` : "ชื่อ interest ใหม่"}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {!activeCategory && (
                        <select
                            value={newCategoryId}
                            onChange={(e) => setNewCategoryId(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        >
                            <option value="">เลือกหมวด...</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        type="button"
                        onClick={create}
                        disabled={disabled || !canCreate}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
                    >
                        เพิ่ม
                    </button>
                </div>
                {draftName && exactExists(draftName) && (
                    <p className="text-xs text-muted-foreground">มี &quot;{draftName}&quot; อยู่แล้ว — กดเลือกจากรายการด้านบนได้เลย</p>
                )}
            </div>
        </div>
    );
}
