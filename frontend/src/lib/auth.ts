import type { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'rentpi_token';

type AuthResponse = {
  token: string;
  user: User;
};

type ApiError = Error & { status?: number };

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

export async function loginRequest(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJson<AuthResponse>(response);
}

export async function registerRequest(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJson<AuthResponse>(response);
}

export async function meRequest(token: string): Promise<{ user: User }> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseJson<{ user: User }>(response);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
