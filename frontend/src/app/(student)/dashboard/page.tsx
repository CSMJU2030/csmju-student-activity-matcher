import { getStudents } from "@/lib/data/students";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
    const allStudents = await getStudents();

    return <DashboardClient allStudents={allStudents} />;
}
