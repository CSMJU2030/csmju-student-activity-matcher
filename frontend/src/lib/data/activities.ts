export interface ActivityData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  creatorId: string;
  createdAt: string;
  participants: { studentId: string }[];
  interests: { interestId: string }[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

export async function getActivities(token: string = ""): Promise<ActivityData[]> {
  try {
    const res = await fetch(`${BASE_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("fetchActivities error:", error);
    return [];
  }
}

export async function getActivityById(id: string, token: string = ""): Promise<ActivityData | null> {
  try {
    const res = await fetch(`${BASE_URL}/activities/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("fetchActivityById error:", error);
    return null;
  }
}

export async function getUpcomingActivities(token: string = ""): Promise<ActivityData[]> {
  // In a real scenario, the backend endpoint should support filtering by date via query params.
  // For now, we will fetch all and filter in frontend or rely on a generic endpoint.
  const activities = await getActivities(token);
  const today = new Date().toISOString().split("T")[0];
  return activities.filter(a => a.date >= today).sort((a,b) => a.date.localeCompare(b.date));
}

export async function searchActivities(query: string, token: string = ""): Promise<ActivityData[]> {
  const activities = await getActivities(token);
  const q = query.toLowerCase().trim();
  if (!q) return activities;
  return activities.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q)
  );
}
