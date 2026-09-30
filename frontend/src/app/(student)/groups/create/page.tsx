import { getCategories, getInterests } from "@/lib/data/interests";
import { CreateGroupClient } from "./CreateGroupClient";

export default async function CreateGroupPage() {
    const [allInterests, categories] = await Promise.all([
        getInterests(),
        getCategories()
    ]);

    return (
        <CreateGroupClient
            allInterests={allInterests}
            categories={categories}
        />
    );
}
