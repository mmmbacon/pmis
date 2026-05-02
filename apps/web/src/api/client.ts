import type { AuthResponse, Project, ProjectSummary, Task, Timesheet, TimesheetInput, User } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

interface TokenProvider {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens(response: AuthResponse): void;
  clear(): void;
}

let tokenProvider: TokenProvider | null = null;

export const registerTokenProvider = (provider: TokenProvider): void => {
  tokenProvider = provider;
};

const request = async <T>(path: string, options: RequestInit = {}, retry = true): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (tokenProvider?.accessToken) {
    headers.set('Authorization', `Bearer ${tokenProvider.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && retry && tokenProvider?.refreshToken) {
    try {
      const refreshed = await authApi.refresh(tokenProvider.refreshToken);
      tokenProvider.setTokens(refreshed);
      return request<T>(path, options, false);
    } catch {
      tokenProvider.clear();
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: response.statusText }))) as { message?: string };
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message ?? response.statusText);
  }
  return (await response.json()) as T;
};

export const authApi = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  refresh: (refreshToken: string): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false),
  logout: (): Promise<{ ok: true }> => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  me: (): Promise<User> => request<User>('/users/me'),
};

export const projectsApi = {
  list: (): Promise<Project[]> => request<Project[]>('/projects'),
};

export const tasksApi = {
  list: (): Promise<Task[]> => request<Task[]>('/tasks'),
};

export const timesheetsApi = {
  list: (): Promise<Timesheet[]> => request<Timesheet[]>('/timesheets'),
  get: (id: string): Promise<Timesheet> => request<Timesheet>(`/timesheets/${id}`),
  save: (input: TimesheetInput): Promise<Timesheet> =>
    request<Timesheet>('/timesheets', { method: 'POST', body: JSON.stringify(input) }),
  submit: (id: string): Promise<Timesheet> => request<Timesheet>(`/timesheets/${id}/submit`, { method: 'POST' }),
};

export const approvalsApi = {
  list: (): Promise<Timesheet[]> => request<Timesheet[]>('/approvals'),
  approve: (id: string, note?: string): Promise<Timesheet> =>
    request<Timesheet>(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
  reject: (id: string, note?: string): Promise<Timesheet> =>
    request<Timesheet>(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
};

export const reportingApi = {
  projectSummary: (): Promise<ProjectSummary[]> => request<ProjectSummary[]>('/reporting/projects'),
};
