import { getStudents } from "@/lib/data/students";
import { getActivitiesResult } from "@/lib/data/activities";
import { getInterests } from "@/lib/data/interests";
import { ActivitiesClient } from "./ActivitiesClient";

export default async function ActivitiesPage() {
    const [allStudents, activitiesResult, allInterests] = await Promise.all([
        getStudents(),
        getActivitiesResult(),
        getInterests(),
    ]);

    return (
        <ActivitiesClient
            allStudents={allStudents}
            allActivities={activitiesResult.data}
            allInterests={allInterests}
            error={activitiesResult.error}
        />
    );
}
