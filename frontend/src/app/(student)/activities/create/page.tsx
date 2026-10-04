import { getCategories, getInterests } from "@/lib/data/interests";
import { CreateActivityClient } from "./CreateActivityClient";

export default async function CreateActivityPage() {
    const [allInterests, categories] = await Promise.all([
        getInterests(),
        getCategories()
    ]);

    return (
        <CreateActivityClient
            allInterests={allInterests}
            categories={categories}
        />
    );
}
