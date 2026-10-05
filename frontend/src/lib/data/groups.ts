import { fetchJsonWithAuth, toQuery } from "@/lib/api/apiClient";

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

export async function getGroups(token: string = ""): Promise<GroupData[]> {
  try {
    return await fetchJsonWithAuth(`/groups`);
  } catch { return []; }
}

export async function getGroupById(id: string, token: string = ""): Promise<GroupData | null> {
  try {
    return await fetchJsonWithAuth(`/groups/${id}`);
  } catch { return null; }
}

export async function getGroupsByMember(studentId: string, token: string = ""): Promise<GroupData[]> {
  try {
    return await fetchJsonWithAuth(`/groups${toQuery({ memberId: studentId })}`);
  } catch { return []; }
}

export async function searchGroups(query: string, token: string = ""): Promise<GroupData[]> {
  try {
    return await fetchJsonWithAuth(`/groups${toQuery({ search: query.trim() })}`);
  } catch { return []; }
}
