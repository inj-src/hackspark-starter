import { getStoredToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

type ApiError = Error & { status?: number };

export type CommunityPost = {
  id: string;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
  likes: number;
};

function normalizeError(status: number, message: string): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  return err;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Request failed';
    throw normalizeError(response.status, message);
  }
  return data as T;
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listCommunityPosts(): Promise<{ posts: CommunityPost[] }> {
  const response = await fetch(`${API_BASE_URL}/community/posts`);
  return parseJson<{ posts: CommunityPost[] }>(response);
}

export async function createCommunityPost(payload: { body: string }): Promise<{ post: CommunityPost }> {
  const response = await fetch(`${API_BASE_URL}/community/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseJson<{ post: CommunityPost }>(response);
}

export async function likePost(postId: string): Promise<{ post: { id: string; likes: number } }> {
  const response = await fetch(`${API_BASE_URL}/community/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    headers: authHeaders(),
  });

  return parseJson<{ post: { id: string; likes: number } }>(response);
}

export async function unlikePost(postId: string): Promise<{ post: { id: string; likes: number } }> {
  const response = await fetch(`${API_BASE_URL}/community/posts/${encodeURIComponent(postId)}/unlike`, {
    method: 'POST',
    headers: authHeaders(),
  });

  return parseJson<{ post: { id: string; likes: number } }>(response);
}
