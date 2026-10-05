import { AdminInterestsClient } from "./AdminInterestsClient";
import { getInterests, getCategories } from "@/lib/data/interests";
import { getInterestStatistics } from "@/lib/actions";

export default async function AdminInterestsPage() {
    const [allInterests, allCategories, statistics] = await Promise.all([
        getInterests(),
        getCategories(),
        getInterestStatistics(),
    ]);

    return (
        <AdminInterestsClient
            allInterests={allInterests}
            allCategories={allCategories}
            statistics={statistics}
        />
    );
}
