"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_KEY, apiSend, fetchJsonWithAuth, toQuery } from "./api/apiClient";

// Every write below acts as the logged-in student: the backend resolves who
// that is from the Core Hub token, so the `studentId` arguments only pick the
// profile URL and are re-checked server-side (students can only edit themselves).

export async function setTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_KEY, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
}

export async function clearTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_KEY);
}

/**
 * After any write, drop the cached render of EVERY page (student and admin):
 * an admin edit must show up on the student pages and vice versa, so data is
 * never shown from a stale cache. The paths are kept as documentation.
 */
function revalidate(..._paths: string[]) {
  revalidatePath("/", "layout");
}

interface MatchedStudent { id: string; name: string; studentId: string }

/** Up to 5 other students who also picked this interest (the MIS "match!" popup). */
async function studentsSharing(interestId: string): Promise<MatchedStudent[]> {
  try {
    const { students } = await fetchJsonWithAuth(`/students/discover${toQuery({ interestIds: [interestId], limit: 5 })}`);
    return students.map((s: MatchedStudent) => ({ id: s.id, name: s.name, studentId: s.studentId }));
  } catch {
    return [];
  }
}

// ── Interest Actions ────────────────────────────────────────

export async function addInterestToStudent(studentId: string, interestId: string) {
  const res = await apiSend("POST", `/students/${studentId}/interests/${interestId}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate("/profile", "/discover", "/matches", "/dashboard");
  return { success: true, matchedStudents: await studentsSharing(interestId) };
}

export async function removeInterestFromStudent(studentId: string, interestId: string) {
  const res = await apiSend("DELETE", `/students/${studentId}/interests/${interestId}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate("/profile", "/discover", "/matches", "/dashboard");
  return { success: true };
}

export async function createCustomInterest(studentId: string, name: string, categoryId: string) {
  const res = await apiSend<{ interestId: string }>("POST", `/students/${studentId}/interests/custom`, { name, categoryId });
  if (!res.success) return { success: false, error: res.error };
  revalidate("/profile", "/discover", "/matches");
  return { success: true, interestId: res.data.interestId, matchedStudents: await studentsSharing(res.data.interestId) };
}

// ── Looking For Actions ─────────────────────────────────────

export async function toggleLookingFor(studentId: string, lookingForId: string) {
  const res = await apiSend("POST", `/students/${studentId}/looking-for/${lookingForId}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate("/profile", "/discover");
  return { success: true };
}

// ── Profile Actions ─────────────────────────────────────────

export async function updateBio(studentId: string, bio: string) {
  const res = await apiSend("PATCH", `/students/${studentId}/bio`, { bio });
  if (!res.success) return { success: false, error: res.error };
  revalidate("/profile");
  return { success: true };
}

// ── Admin Actions ───────────────────────────────────────────

export async function adminCreateInterest(name: string, categoryId: string, icon: string = "⭐") {
  const res = await apiSend<{ interest: unknown }>("POST", `/interests/admin`, { name, categoryId, icon });
  if (!res.success) return { success: false, error: res.error };
  revalidate("/admin/interests");
  return { success: true, interest: res.data.interest };
}

export async function adminUpdateInterest(interestId: string, payload: { name?: string; categoryId?: string; icon?: string }) {
  const res = await apiSend("PATCH", `/interests/admin/${interestId}`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate("/admin/interests");
  return { success: true };
}

/** Enable / disable an interest (a no-op in MIS; real here). */
export async function adminToggleInterest(interestId: string, isActive: boolean) {
  const res = await apiSend("PATCH", `/interests/admin/${interestId}`, { isActive });
  if (!res.success) return { success: false, error: res.error };
  revalidate("/admin/interests", "/profile", "/discover");
  return { success: true };
}

export async function getInterestStatistics() {
  try {
    return await fetchJsonWithAuth(`/interests/statistics`);
  } catch {
    return null;
  }
}

// ── Group Actions ───────────────────────────────────────────

export async function createGroup(studentId: string, payload: { name: string; description: string; interestIds: string[]; coverImage?: string }) {
  const res = await apiSend<{ groupId: string }>("POST", `/groups`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate("/groups", "/dashboard");
  return { success: true, groupId: res.data.groupId };
}

export async function joinGroup(studentId: string, groupId: string) {
  const res = await apiSend("POST", `/groups/${groupId}/join`);
  if (!res.success) return { success: false, error: res.error };
  revalidate(`/groups/${groupId}`, "/groups", "/dashboard");
  return { success: true };
}

export async function leaveGroup(studentId: string, groupId: string) {
  const res = await apiSend("DELETE", `/groups/${groupId}/leave`);
  if (!res.success) return { success: false, error: res.error };
  revalidate(`/groups/${groupId}`, "/groups", "/dashboard");
  return { success: true };
}

// ── Activity Actions ────────────────────────────────────────

export async function createActivity(studentId: string, payload: {
  title: string; description: string; date: string; time: string;
  location: string; capacity: number; interestIds: string[]; coverImage?: string;
}) {
  const res = await apiSend<{ id: string }>("POST", `/activities`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate("/activities", "/dashboard");
  return { success: true, activityId: res.data.id };
}

export async function joinActivity(studentId: string, activityId: string) {
  const res = await apiSend("POST", `/activities/${activityId}/join`);
  if (!res.success) return { success: false, error: res.error };
  revalidate(`/activities/${activityId}`, "/activities", "/dashboard");
  return { success: true };
}

export async function leaveActivity(studentId: string, activityId: string) {
  const res = await apiSend("DELETE", `/activities/${activityId}/leave`);
  if (!res.success) return { success: false, error: res.error };
  revalidate(`/activities/${activityId}`, "/activities", "/dashboard");
  return { success: true };
}

// ── Dashboard Actions ───────────────────────────────────────

export async function getDashboardData(studentId: string) {
  try {
    return await fetchJsonWithAuth(`/students/${studentId}/dashboard`);
  } catch {
    return null;
  }
}

// ── Admin: student profiles ─────────────────────────────────

export async function adminUpdateStudent(studentId: string, payload: { name?: string; faculty?: string; program?: string; year?: number; bio?: string }) {
  const res = await apiSend("PATCH", `/students/${studentId}`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate("/admin/students", `/admin/students/${studentId}`, `/students/${studentId}`);
  return { success: true };
}

// ── Groups & activities: creator or admin ───────────────────

type GroupPatch = { name?: string; description?: string; interestIds?: string[] };
type ActivityPatch = {
  title?: string; description?: string; date?: string; time?: string;
  location?: string; capacity?: number; interestIds?: string[];
};

export async function updateGroup(groupId: string, payload: GroupPatch) {
  const res = await apiSend("PATCH", `/groups/${groupId}`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function deleteGroup(groupId: string) {
  const res = await apiSend("DELETE", `/groups/${groupId}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function removeGroupMember(groupId: string, studentId: string) {
  const res = await apiSend("DELETE", `/groups/${groupId}/members/${studentId}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function updateActivity(activityId: string, payload: ActivityPatch) {
  const res = await apiSend("PATCH", `/activities/${activityId}`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function deleteActivity(activityId: string) {
  const res = await apiSend("DELETE", `/activities/${activityId}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function removeActivityParticipant(activityId: string, studentId: string) {
  const res = await apiSend("DELETE", `/activities/${activityId}/participants/${studentId}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

// ── Admin: interest categories & looking-for options ───────

export async function createCategory(payload: { name: string; icon: string; color: string }) {
  const res = await apiSend("POST", `/interests/categories`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function updateCategory(id: string, payload: { name?: string; icon?: string; color?: string }) {
  const res = await apiSend("PATCH", `/interests/categories/${id}`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function deleteCategory(id: string) {
  const res = await apiSend("DELETE", `/interests/categories/${id}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function createLookingFor(payload: { label: string; icon: string }) {
  const res = await apiSend("POST", `/interests/looking-for-options`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function updateLookingFor(id: string, payload: { label?: string; icon?: string }) {
  const res = await apiSend("PATCH", `/interests/looking-for-options/${id}`, payload);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true };
}

export async function deleteLookingFor(id: string) {
  const res = await apiSend<{ removedFromStudents: number }>("DELETE", `/interests/looking-for-options/${id}`);
  if (!res.success) return { success: false, error: res.error };
  revalidate();
  return { success: true, removedFromStudents: res.data.removedFromStudents };
}
