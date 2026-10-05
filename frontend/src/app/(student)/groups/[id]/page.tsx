import { getStudents } from "@/lib/data/students";
import { getGroupById } from "@/lib/data/groups";
import { getInterests } from "@/lib/data/interests";
import { GroupDetailClient } from "./GroupDetailClient";
import { notFound } from "next/navigation";

export default async function GroupDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const [group, allStudents, allInterests] = await Promise.all([
        getGroupById(id),
        getStudents(),
        getInterests()
    ]);

    if (!group) return notFound();

    return <GroupDetailClient group={group} allStudents={allStudents} allInterests={allInterests} />;
}
