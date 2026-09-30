"use server";

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
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

export async function getStudents(token: string = ""): Promise<StudentData[]> {
  try {
    const res = await fetch(`${BASE_URL}/students`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) { return []; }
}

export async function getStudentById(id: string, token: string = ""): Promise<StudentData | null> {
  try {
    const res = await fetch(`${BASE_URL}/students/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  } catch (error) { return null; }
}

export async function getStudentByStudentId(studentId: string, token: string = ""): Promise<StudentData | null> {
  try {
    const res = await fetch(`${BASE_URL}/students/by-student-id/${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  } catch (error) { return null; }
}

export async function getStudentsByInterest(interestId: string, token: string = ""): Promise<StudentData[]> {
  return []; // Mocked
}

export async function searchStudents(query: string, token: string = ""): Promise<StudentData[]> {
  return []; // Mocked
}

export async function discoverStudents(filters: any, token: string = ""): Promise<{ students: StudentData[]; total: number }> {
  return { students: [], total: 0 }; // Mocked
}
