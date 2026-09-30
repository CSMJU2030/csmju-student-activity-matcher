// wrapper for Activity REST APIs 
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

export async function fetchActivities(token: string) {
  const res = await fetch(`${BASE_URL}/activities`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch activities');
  return res.json();
}

export async function fetchActivityById(token: string, id: string) {
  const res = await fetch(`${BASE_URL}/activities/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch activity');
  return res.json();
}

export async function createActivityFn(token: string, data: any) {
  const res = await fetch(`${BASE_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create activity');
  return json;
}

export async function joinActivityFn(token: string, id: string) {
    const res = await fetch(`${BASE_URL}/activities/${id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to join activity');
    return json;
}

export async function leaveActivityFn(token: string, id: string) {
    const res = await fetch(`${BASE_URL}/activities/${id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to leave activity');
    return json;
}
