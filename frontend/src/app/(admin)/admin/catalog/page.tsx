import { getCategoriesWithCounts, getLookingForWithCounts } from "@/lib/data/interests";
import { CatalogClient } from "./CatalogClient";

export default async function AdminCatalogPage() {
    const [categories, lookingFor] = await Promise.all([getCategoriesWithCounts(), getLookingForWithCounts()]);
    return <CatalogClient categories={categories} lookingFor={lookingFor} />;
}
