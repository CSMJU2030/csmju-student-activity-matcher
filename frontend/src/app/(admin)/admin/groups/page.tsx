import { getStudents } from "@/lib/data/students";
import { getGroups } from "@/lib/data/groups";
import { getInterests } from "@/lib/data/interests";
import { AdminGroupsClient } from "./AdminGroupsClient";

export default async function AdminGroupsPage() {
    const [allStudents, allGroups, allInterests] = await Promise.all([
        getStudents(),
        getGroups(),
        getInterests(),
    ]);

    return (
        <AdminGroupsClient
            allStudents={allStudents}
            allGroups={allGroups}
            allInterests={allInterests}
        />
    );
}
