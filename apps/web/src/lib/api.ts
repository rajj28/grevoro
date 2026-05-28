const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('grv_token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export type UserRole =
  | 'HOUSEHOLD'
  | 'COLLECTOR'
  | 'RAGPICKER'
  | 'KABADIWALA'
  | 'RECYCLER'
  | 'ADMIN';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  langPref: string;
  walletBalance: number;
  reputationScore: number;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface Batch {
  id: string;
  shortcode: string;
  materialType: string;
  status: string;
  weightKg: number;
  qualityGrade: string | null;
  contaminationPct: number | null;
  description: string | null;
  originUserId: string;
  currentCustodianId: string;
  createdAt: string;
  updatedAt: string;
}
