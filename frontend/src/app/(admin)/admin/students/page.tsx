import { getStudents } from "@/lib/data/students";
import { AdminStudentsClient } from "./AdminStudentsClient";

export default async function AdminStudentsPage() {
    const students = await getStudents();

    return <AdminStudentsClient students={students} />;
}
