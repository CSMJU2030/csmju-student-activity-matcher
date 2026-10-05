import { getStudents } from "@/lib/data/students";
import { getGroups } from "@/lib/data/groups";
import { getInterests } from "@/lib/data/interests";
import { GroupsClient } from "./GroupsClient";

export default async function GroupsPage() {
    const [allStudents, allGroups, allInterests] = await Promise.all([
        getStudents(),
        getGroups(),
        getInterests(),
    ]);

    return (
        <GroupsClient
            allStudents={allStudents}
            allGroups={allGroups}
            allInterests={allInterests}
        />
    );
}
