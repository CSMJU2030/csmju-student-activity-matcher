import { getStudents } from "@/lib/data/students";
import { getActivities } from "@/lib/data/activities";
import { getInterests } from "@/lib/data/interests";
import { ActivitiesClient } from "./ActivitiesClient";

export default async function ActivitiesPage() {
    const [allStudents, allActivities, allInterests] = await Promise.all([
        getStudents(),
        getActivities(),
        getInterests(),
    ]);

    return (
        <ActivitiesClient
            allStudents={allStudents}
            allActivities={allActivities}
            allInterests={allInterests}
        />
    );
}
