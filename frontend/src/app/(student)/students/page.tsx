import { getStudents } from "@/lib/data/students";
import { StudentListClient } from "./StudentListClient";

export default async function StudentsPage() {
    const students = await getStudents();

    return <StudentListClient students={students} />;
}
