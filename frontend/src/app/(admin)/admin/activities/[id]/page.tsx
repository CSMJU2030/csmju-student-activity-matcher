import { notFound } from "next/navigation";
import { getActivityById } from "@/lib/data/activities";
import { getInterests } from "@/lib/data/interests";
import { getStudents } from "@/lib/data/students";
import { AdminActivityEditor } from "./AdminActivityEditor";

export default async function AdminActivityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [activity, allInterests, allStudents] = await Promise.all([getActivityById(id), getInterests(), getStudents()]);
    if (!activity) return notFound();
    return <AdminActivityEditor activity={activity} allInterests={allInterests} allStudents={allStudents} />;
}
