import { getStudentById, getStudents } from "@/lib/data/students";
import { getInterests, getLookingForOptions } from "@/lib/data/interests";
import { StudentDetailClient } from "./StudentDetailClient";

export default async function StudentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const [student, allStudents, allInterests, lookingForOptions] = await Promise.all([
        getStudentById(id),
        getStudents(),
        getInterests(),
        getLookingForOptions(),
    ]);

    return (
        <StudentDetailClient
            student={student || null}
            allStudents={allStudents}
            allInterests={allInterests}
            lookingForOptions={lookingForOptions}
        />
    );
}
