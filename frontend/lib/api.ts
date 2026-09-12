const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trao_token');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('trao_token', token);
  } else {
    localStorage.removeItem('trao_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
    }
    throw new Error(data.error?.message || 'An error occurred while communicating with the server.');
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST'
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  // Kits
  createKit: (payload: { jobDescription: string; companyUrl: string; daysAvailable: number; interviewNotes?: string }) =>
    request<{ id: string; status: string; stepMessage: string; progressPercent: number }>('/kits', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getUserKits: () => request<{ kits: any[] }>('/kits'),

  getKitById: (id: string) => request<{
    id: string;
    companyUrl?: string;
    jobDescription?: string;
    daysAvailable?: number;
    status: string;
    stepMessage: string;
    progressPercent: number;
    logs?: { text: string; time: string; url?: string }[];
    crawledSources?: { name: string; url: string; status: string }[];
    data?: any;
    error?: any;
  }>(`/kits/${id}`),

  updateKitData: (id: string, data: any) =>
    request<{ status: string; data: any }>(`/kits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ data })
    }),

  deleteKit: (id: string) =>
    request(`/kits/${id}`, {
      method: 'DELETE'
    }),

  regenerateCategory: (id: string, category: string) =>
    request<{ status: string; data: any }>(`/kits/${id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ category })
    }),

  updateFlashcardConfidence: (id: string, flashcardId: string, confidence: number) =>
    request<{ status: string; flashcards: any[] }>(`/kits/${id}/flashcards/confidence`, {
      method: 'PATCH',
      body: JSON.stringify({ flashcardId, confidence })
    })
};
