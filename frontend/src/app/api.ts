import { Application, Resume, ReminderPrefs } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error ?? `HTTP ${res.status}`);
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name: string) {
  return request<{ user: unknown; token: string; session: { access_token: string } }>('POST', '/signup', { email, password, name });
}

export async function signIn(email: string, password: string) {
  return request<{ user: unknown; token: string; session: { access_token: string } }>('POST', '/signin', { email, password });
}

export async function getMe(token: string) {
  return request<{ user: unknown; session: { access_token: string } }>('GET', '/me', undefined, token);
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function fetchApplications(token: string): Promise<Application[]> {
  const data = await request<{ applications: Application[] }>('GET', '/applications', undefined, token);
  return data.applications ?? [];
}

export async function createApplication(app: Omit<Application, 'id' | 'createdAt'>, token: string): Promise<Application> {
  const data = await request<{ application: Application }>('POST', '/applications', app, token);
  return data.application;
}

export async function updateApplication(id: string, updates: Partial<Application>, token: string): Promise<Application> {
  const data = await request<{ application: Application }>('PUT', `/applications/${id}`, updates, token);
  return data.application;
}

export async function deleteApplication(id: string, token: string): Promise<void> {
  await request<{ success: boolean }>('DELETE', `/applications/${id}`, undefined, token);
}

// ── Push Notifications ────────────────────────────────────────────────────────

export async function fetchVapidPublicKey(token: string): Promise<string> {
  const data = await request<{ publicKey: string }>('GET', '/vapid-public-key', undefined, token);
  return data.publicKey;
}

export async function savePushSubscription(sub: PushSubscriptionJSON, token: string): Promise<void> {
  await request('POST', '/push/subscribe', sub, token);
}

export async function removePushSubscription(endpoint: string, token: string): Promise<void> {
  await request('DELETE', '/push/subscribe', { endpoint }, token);
}

// ── Email Reminders ───────────────────────────────────────────────────────────

export async function checkReminders(
  token: string,
  daysThreshold = 7,
): Promise<{ sent: boolean; count?: number; reason?: string; skipped?: boolean }> {
  return request('POST', '/reminders/check', { daysThreshold }, token);
}

export async function fetchReminderPrefs(token: string): Promise<ReminderPrefs> {
  const data = await request<{ prefs: ReminderPrefs }>('GET', '/reminders/preferences', undefined, token);
  return data.prefs;
}

export async function saveReminderPrefs(prefs: ReminderPrefs, token: string): Promise<void> {
  await request('POST', '/reminders/preferences', prefs, token);
}

// ── Resume Vault ──────────────────────────────────────────────────────────────

export async function uploadResume(
  appId: string,
  file: File,
  version: string,
  notes: string,
  token: string,
): Promise<Resume> {
  const form = new FormData();
  form.append('file', file);
  form.append('version', version);
  form.append('notes', notes);

  const res = await fetch(`${BASE_URL}/resumes/${appId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error ?? `HTTP ${res.status}`);
  return (data as { resume: Resume }).resume;
}

export async function fetchResumesForApp(appId: string, token: string): Promise<Resume[]> {
  const data = await request<{ resumes: Resume[] }>('GET', `/resumes/${appId}`, undefined, token);
  return data.resumes ?? [];
}

export async function fetchAllResumes(token: string): Promise<Resume[]> {
  const data = await request<{ resumes: Resume[] }>('GET', '/resumes', undefined, token);
  return data.resumes ?? [];
}

export async function getResumeDownloadUrl(appId: string, resumeId: string, token: string): Promise<string> {
  const data = await request<{ url: string }>('GET', `/resumes/${appId}/${resumeId}/url`, undefined, token);
  // Cloudinary returns a full absolute URL — return it directly
  return data.url;
}

export async function deleteResume(appId: string, resumeId: string, token: string): Promise<void> {
  await request('DELETE', `/resumes/${appId}/${resumeId}`, undefined, token);
}
