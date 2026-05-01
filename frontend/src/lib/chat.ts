const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  timestamp: string;
};

export type ChatSession = {
  sessionId: string;
  name: string;
  lastMessageAt: string;
};

export async function fetchSessions(): Promise<{ sessions: ChatSession[] }> {
  const response = await fetch(`${API_BASE_URL}/sessions`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch sessions');
  }
  return data;
}

export async function fetchSessionHistory(sessionId: string): Promise<{ sessionId: string; name: string; messages: ChatMessage[] }> {
  const response = await fetch(`${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/history`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch history');
  }
  return data;
}

export async function sendChatMessage(payload: { sessionId: string; message: string }): Promise<{ sessionId: string; reply: string }> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to send message');
  }
  return data;
}

export async function deleteSession(sessionId: string): Promise<{ deleted: boolean }> {
  const response = await fetch(`${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to delete session');
  }
  return data;
}
