import { notFound } from "next/navigation";
import { getStudentById } from "@/lib/data/students";
import { getCategories, getInterests, getLookingForOptions } from "@/lib/data/interests";
import { getGroups } from "@/lib/data/groups";
import { getActivities } from "@/lib/data/activities";
import { AdminStudentEditor } from "./AdminStudentEditor";

export default async function AdminStudentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [student, allInterests, categories, lookingForOptions, groups, activities] = await Promise.all([
        getStudentById(id),
        getInterests(),
        getCategories(),
        getLookingForOptions(),
        getGroups(),
        getActivities(),
    ]);
    if (!student) return notFound();

    return (
        <AdminStudentEditor
            student={student}
            allInterests={allInterests}
            categories={categories}
            lookingForOptions={lookingForOptions}
            groups={groups.filter((g) => g.members.some((m) => m.studentId === id))}
            activities={activities.filter((a) => a.participants.some((p) => p.studentId === id))}
        />
    );
}
