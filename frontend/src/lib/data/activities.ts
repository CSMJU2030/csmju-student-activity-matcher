import { HttpError, fetchJsonWithAuth, toQuery } from "@/lib/api/apiClient";
/** The collection is paginated (api-conventions); 100 is the largest page. */
const MAX_PAGE = 100;
const ALL = toQuery({ limit: MAX_PAGE });

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
    return { data: await fetchJsonWithAuth(`/activities${ALL}`), error: null };
  } catch (error) {
    console.error("fetchActivities error:", error);
    return { data: [], error: error instanceof Error ? error.message : "Failed to load activities" };
  }
}

export async function getActivities(token: string = ""): Promise<ActivityData[]> {
  try {
    return await fetchJsonWithAuth(`/activities${ALL}`);
  } catch (error) {
    console.error("fetchActivities error:", error);
    return [];
  }
}

export async function getActivityById(id: string, token: string = ""): Promise<ActivityData | null> {
  try {
    return await fetchJsonWithAuth(`/activities/${id}`);
  } catch (error) {
    // 404 is a normal answer (e.g. right after the activity was cancelled)
    if (!(error instanceof HttpError && error.status === 404)) console.error("fetchActivityById error:", error);
    return null;
  }
}

/** Today or later, soonest first - filtered and sorted by the backend. */
export async function getUpcomingActivities(token: string = ""): Promise<ActivityData[]> {
  try {
    return await fetchJsonWithAuth(`/activities${toQuery({ upcoming: true, limit: MAX_PAGE })}`);
  } catch { return []; }
}

export async function searchActivities(query: string, token: string = ""): Promise<ActivityData[]> {
  try {
    return await fetchJsonWithAuth(`/activities${toQuery({ search: query.trim(), limit: MAX_PAGE })}`);
  } catch { return []; }
}
