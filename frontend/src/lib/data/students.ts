import { fetchJsonWithAuth, toQuery } from "@/lib/api/apiClient";

export interface StudentData {
  id: string;
  studentId: string;
  name: string;
  faculty: string;
  program: string;
  year: number;
  bio: string | null;
  dataSource: string;
  interestIds: string[];
  lookingForIds: string[];
  createdAt: string;
  groupIds?: string[];
  activityIds?: string[];
}

export interface DiscoverFilters {
  search?: string;
  interestIds?: string[];
  year?: number;
  lookingForId?: string;
  /** Leave the logged-in student out of the results (default true). */
  excludeSelf?: boolean;
  limit?: number;
  offset?: number;
}

export async function getStudents(token: string = ""): Promise<StudentData[]> {
  try {
    return await fetchJsonWithAuth(`/students`);
  } catch { return []; }
}

/** The logged-in user's own profile, resolved by the backend from the token. */
export async function getMyStudent(): Promise<StudentData | null> {
  try {
    return await fetchJsonWithAuth(`/students/me`);
  } catch { return null; }
}

export async function getStudentById(id: string, token: string = ""): Promise<StudentData | null> {
  try {
    return await fetchJsonWithAuth(`/students/${id}`);
  } catch { return null; }
}

export async function getStudentByStudentId(studentId: string, token: string = ""): Promise<StudentData | null> {
  try {
    return await fetchJsonWithAuth(`/students/by-student-id/${studentId}`);
  } catch { return null; }
}

export async function discoverStudents(filters: DiscoverFilters = {}, token: string = ""): Promise<{ students: StudentData[]; total: number }> {
  try {
    return await fetchJsonWithAuth(`/students/discover${toQuery({ ...filters })}`);
  } catch { return { students: [], total: 0 }; }
}

export async function getStudentsByInterest(interestId: string, token: string = ""): Promise<StudentData[]> {
  const { students } = await discoverStudents({ interestIds: [interestId], excludeSelf: false, limit: 100 });
  return students;
}

export async function searchStudents(query: string, token: string = ""): Promise<StudentData[]> {
  if (!query.trim()) return getStudents();
  const { students } = await discoverStudents({ search: query, excludeSelf: false, limit: 100 });
  return students;
}
