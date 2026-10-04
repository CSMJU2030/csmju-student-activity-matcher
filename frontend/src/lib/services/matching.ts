"use server";

// Matching runs in the backend (Jaccard similarity of interests, same formula
// as MIS): matchPercentage = |common interests| / |union of interests| * 100.
import { fetchJsonWithAuth } from "@/lib/api/apiClient";

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

export async function getMatchesForStudent(studentId: string, limit: number = 20, token: string = ""): Promise<MatchResult[]> {
  try {
    const matches: MatchResult[] = await fetchJsonWithAuth(`/students/${studentId}/matches`);
    return matches.slice(0, limit);
  } catch { return []; }
}

export async function getCommonInterests(studentAId: string, studentBId: string, token: string = ""): Promise<{ commonInterests: MatchInterest[]; matchPercentage: number }> {
  try {
    return await fetchJsonWithAuth(`/students/${studentAId}/common-interests/${studentBId}`);
  } catch { return { commonInterests: [], matchPercentage: 0 }; }
}
