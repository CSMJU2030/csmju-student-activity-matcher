import { getStudents } from "@/lib/data/students";
import { getInterests, getCategories, getLookingForOptions } from "@/lib/data/interests";
import { DiscoverClient } from "./DiscoverClient";

export default async function DiscoverPage() {
    const [allStudents, allInterests, allCategories, lookingForOptions] = await Promise.all([
        getStudents(),
        getInterests(),
        getCategories(),
        getLookingForOptions(),
    ]);

    return (
        <DiscoverClient
            allStudents={allStudents}
            allInterests={allInterests}
            allCategories={allCategories}
            lookingForOptions={lookingForOptions}
        />
    );
}
