import { fetchJsonWithAuth, toQuery } from "@/lib/api/apiClient";
export interface ActivityData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  coverImage?: string | null;
  creatorId: string;
  createdAt: string;
  participants: { studentId: string }[];
  interests: { interestId: string }[];
}

/** Like getActivities, but reports the failure instead of silently returning []. */
export async function getActivitiesResult(): Promise<{ data: ActivityData[]; error: string | null }> {
  try {
    return { data: await fetchJsonWithAuth(`/activities`), error: null };
  } catch (error) {
    console.error("fetchActivities error:", error);
    return { data: [], error: error instanceof Error ? error.message : "Failed to load activities" };
  }
}

export async function getActivities(token: string = ""): Promise<ActivityData[]> {
  try {
    return await fetchJsonWithAuth(`/activities`);
  } catch (error) {
    console.error("fetchActivities error:", error);
    return [];
  }
}

export async function getActivityById(id: string, token: string = ""): Promise<ActivityData | null> {
  try {
    return await fetchJsonWithAuth(`/activities/${id}`);
  } catch (error) {
    console.error("fetchActivityById error:", error);
    return null;
  }
}

/** Today or later, soonest first - filtered and sorted by the backend. */
export async function getUpcomingActivities(token: string = ""): Promise<ActivityData[]> {
  try {
    return await fetchJsonWithAuth(`/activities${toQuery({ upcoming: true })}`);
  } catch { return []; }
}

export async function searchActivities(query: string, token: string = ""): Promise<ActivityData[]> {
  try {
    return await fetchJsonWithAuth(`/activities${toQuery({ search: query.trim() })}`);
  } catch { return []; }
}
