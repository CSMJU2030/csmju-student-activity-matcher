"use server";

export interface GroupData {
  id: string;
  name: string;
  description: string;
  coverImage?: string | null;
  creatorId: string;
  createdAt: string;
  members: { studentId: string }[];
  interests: { interestId: string }[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

export async function getGroups(token: string = ""): Promise<GroupData[]> {
  try {
    const res = await fetch(`${BASE_URL}/groups`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export async function getGroupById(id: string, token: string = ""): Promise<GroupData | null> {
  return null;
}

export async function getGroupsByMember(studentId: string, token: string = ""): Promise<GroupData[]> {
  return [];
}

export async function searchGroups(query: string, token: string = ""): Promise<GroupData[]> {
  return [];
}
