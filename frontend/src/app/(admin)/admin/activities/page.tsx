import { getStudents } from "@/lib/data/students";
import { getActivities } from "@/lib/data/activities";
import { getInterests } from "@/lib/data/interests";
import { AdminActivitiesClient } from "./AdminActivitiesClient";

export default async function AdminActivitiesPage() {
    const [allStudents, allActivities, allInterests] = await Promise.all([
        getStudents(),
        getActivities(),
        getInterests(),
    ]);

    return (
        <AdminActivitiesClient
            allStudents={allStudents}
            allActivities={allActivities}
            allInterests={allInterests}
        />
    );
}
