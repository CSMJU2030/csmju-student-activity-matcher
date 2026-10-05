import { apiSend, fetchJsonWithAuth } from './apiClient';

// Client-side chat + notification calls (the browser sends the HttpOnly session cookie).

export interface StudentCard {
  id: string;
  studentId: string;
  name: string;
  program: string;
  year: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  other: StudentCard;
  lastMessage: ChatMessage | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  type: 'MATCH' | 'MESSAGE' | 'UPDATE';
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  actor: { id: string; name: string; studentId: string } | null;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return fetchJsonWithAuth('/chats');
}

/** Get or create the conversation with another student; returns its id. */
export async function openConversation(studentId: string): Promise<string> {
  const res = await apiSend<{ id: string }>('POST', '/chats', { studentId });
  if (!res.success) throw new Error(res.error);
  return res.data.id;
}

export async function getMessages(conversationId: string, after?: string): Promise<{ id: string; other: StudentCard; messages: ChatMessage[] }> {
  const q = after ? `?after=${encodeURIComponent(after)}` : '';
  return fetchJsonWithAuth(`/chats/${conversationId}/messages${q}`);
}

export async function sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
  const res = await apiSend<ChatMessage>('POST', `/chats/${conversationId}/messages`, { body });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function getUnreadCounts(): Promise<{ notifications: number; chats: number }> {
  const [n, c] = await Promise.all([
    fetchJsonWithAuth('/notifications/unread-count').catch(() => ({ unreadCount: 0 })),
    fetchJsonWithAuth('/chats/unread-count').catch(() => ({ unreadCount: 0 })),
  ]);
  return { notifications: n.unreadCount, chats: c.unreadCount };
}

export async function listNotifications(): Promise<{ items: AppNotification[]; unreadCount: number }> {
  return fetchJsonWithAuth('/notifications');
}

export async function markNotificationRead(id: string) {
  return apiSend('PATCH', `/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  return apiSend('POST', '/notifications/read-all');
}

/** "5 นาทีที่แล้ว"-style relative time in Thai. */
export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'เมื่อสักครู่';
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}
