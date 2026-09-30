import { getStudents } from "@/lib/data/students";
import { getActivityById } from "@/lib/data/activities";
import { getInterests } from "@/lib/data/interests";
import { ActivityDetailClient } from "./ActivityDetailClient";
import { notFound } from "next/navigation";

export default async function ActivityDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const [activity, allStudents, allInterests] = await Promise.all([
        getActivityById(id),
        getStudents(),
        getInterests()
    ]);

    if (!activity) return notFound();

    return <ActivityDetailClient activity={activity} allStudents={allStudents} allInterests={allInterests} />;
}
