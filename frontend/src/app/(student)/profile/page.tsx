import { getStudentById, getStudents } from "@/lib/data/students";
import { getInterests, getCategories, getLookingForOptions } from "@/lib/data/interests";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
    const [allStudents, allInterests, allCategories, lookingForOptions] = await Promise.all([
        getStudents(),
        getInterests(),
        getCategories(),
        getLookingForOptions(),
    ]);

    return (
        <ProfileClient
            allStudents={allStudents}
            allInterests={allInterests}
            allCategories={allCategories}
            lookingForOptions={lookingForOptions}
        />
    );
}
