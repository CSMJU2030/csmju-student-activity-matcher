import { notFound } from "next/navigation";
import { getGroupById } from "@/lib/data/groups";
import { getInterests } from "@/lib/data/interests";
import { getStudents } from "@/lib/data/students";
import { AdminGroupEditor } from "./AdminGroupEditor";

export default async function AdminGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [group, allInterests, allStudents] = await Promise.all([getGroupById(id), getInterests(), getStudents()]);
    if (!group) return notFound();
    return <AdminGroupEditor group={group} allInterests={allInterests} allStudents={allStudents} />;
}
