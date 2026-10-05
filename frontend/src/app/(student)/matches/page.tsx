import { getStudents } from "@/lib/data/students";
import { getInterests } from "@/lib/data/interests";
import { MatchesClient } from "./MatchesClient";

export default async function MatchesPage() {
    const [allStudents, allInterests] = await Promise.all([
        getStudents(),
        getInterests(),
    ]);

    return (
        <MatchesClient
            allStudents={allStudents}
            allInterests={allInterests}
        />
    );
}
