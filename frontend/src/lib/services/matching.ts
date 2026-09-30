"use server";

export interface MatchInterest {
  id: string;
  name: string;
  icon: string;
}

export interface MatchResult {
  studentId: string;
  studentName: string;
  studentFaculty: string;
  studentProgram: string;
  studentYear: number;
  studentBio: string | null;
  commonInterests: MatchInterest[];
  matchPercentage: number;
  totalUniqueInterests: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

export async function getMatchesForStudent(studentId: string, limit: number = 20, token: string = ""): Promise<MatchResult[]> {
  try {
    const res = await fetch(`${BASE_URL}/matching/${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export async function getCommonInterests(studentAId: string, studentBId: string, token: string = ""): Promise<{ commonInterests: MatchInterest[]; matchPercentage: number }> {
  return { commonInterests: [], matchPercentage: 0 };
}
