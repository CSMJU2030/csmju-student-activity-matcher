"use server";

// ============================================================
// Server Actions — Migrated to API calls
// ============================================================
import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

const postApi = async (url: string, data: any) => {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch { return false; }
};

export async function addInterestToStudent(studentId: string, interestId: string) {
  const ok = await postApi(`/students/${studentId}/interests`, { interestId });
  if (ok) {
    revalidatePath("/profile"); return { success: true, matchedStudents: [] };
  }
  return { success: false, error: "Failed to add interest" };
}

export async function removeInterestFromStudent(studentId: string, interestId: string) {
  return { success: false, error: "Not implemented" };
}

export async function createCustomInterest(studentId: string, name: string, categoryId: string) {
  return { success: false, error: "Not implemented" };
}

export async function toggleLookingFor(studentId: string, lookingForId: string) {
  return { success: false, error: "Not implemented" };
}

export async function updateBio(studentId: string, bio: string) {
  return { success: false, error: "Not implemented" };
}

export async function adminCreateInterest(name: string, categoryId: string, icon: string = "⭐") {
  return { success: false, error: "Not implemented" };
}

export async function adminUpdateInterest(interestId: string, data: any) {
  return { success: false, error: "Not implemented" };
}

export async function adminToggleInterest(interestId: string, isActive: boolean) {
  return { success: false, error: "Not implemented" };
}

export async function getInterestStatistics() {
  return null;
}

export async function createGroup(studentId: string, data: any) {
  return { success: false, error: "Not implemented" };
}

export async function joinGroup(studentId: string, groupId: string) {
  return { success: false, error: "Not implemented" };
}

export async function leaveGroup(studentId: string, groupId: string) {
  return { success: false, error: "Not implemented" };
}

export async function getDashboardData(studentId: string) {
  return null;
}
