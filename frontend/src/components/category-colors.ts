// Category chip colours. Listed in full here (inside Tailwind's `content` paths)
// so every class exists in the CSS build - the database only stores the string.
export const CATEGORY_COLORS = [
  { label: "ม่วง", value: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "เขียว", value: "bg-green-100 text-green-700 border-green-200" },
  { label: "ชมพูกุหลาบ", value: "bg-rose-100 text-rose-700 border-rose-200" },
  { label: "ฟ้าอมเขียว", value: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { label: "น้ำเงิน", value: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "ชมพู", value: "bg-pink-100 text-pink-700 border-pink-200" },
  { label: "เหลืองอำพัน", value: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "เทา", value: "bg-slate-100 text-slate-700 border-slate-200" },
  { label: "มรกต", value: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { label: "ส้ม", value: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "คราม", value: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { label: "เขียวหัวเป็ด", value: "bg-teal-100 text-teal-700 border-teal-200" },
] as const;
