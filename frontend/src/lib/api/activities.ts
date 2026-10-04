import { apiSend, fetchJsonWithAuth } from './apiClient';

// Client-side activity calls (the token comes from localStorage).
// Each throws an Error carrying the backend's message so the UI can show it.

async function send<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await apiSend<T>(method, url, body);
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function fetchActivities() {
  return fetchJsonWithAuth('/activities');
}

export async function fetchActivityById(id: string) {
  return fetchJsonWithAuth(`/activities/${id}`);
}

export async function createActivityFn(data: {
  title: string; description: string; date: string; time: string;
  location: string; capacity: number; interestIds: string[]; coverImage?: string;
}) {
  return send<{ id: string }>('POST', '/activities', data);
}

export async function joinActivityFn(id: string) {
  return send('POST', `/activities/${id}/join`);
}

export async function leaveActivityFn(id: string) {
  return send('DELETE', `/activities/${id}/leave`);
}
