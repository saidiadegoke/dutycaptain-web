'use client';

/**
 * The API client (P1-15).
 *
 * The console had no client at all — sixteen pages of fixtures. This is the one
 * place that knows the API exists, so a change to a route or an envelope is a
 * change here rather than in every view.
 *
 * TOKEN STORAGE IS `localStorage`, WITH EYES OPEN. The API issues JWTs in the
 * response body and the console is served from a different origin, so an
 * httpOnly cookie is not available without the API setting one — which means
 * any XSS in the console can read the access token. The mitigation that exists
 * today is that access tokens are short-lived and the refresh flow below
 * rotates them; the real fix is a cookie-based session, and it belongs with
 * P7-01 when accounts become multi-user. Recorded rather than glossed.
 *
 * ONE REFRESH AT A TIME. A page that loads a task, its timeline and a stream at
 * once will get three simultaneous 401s when the access token expires. Three
 * refreshes would rotate the refresh token three times and invalidate each
 * other; the in-flight promise below makes the other two wait for the first.
 */

import type {
  Approval, ApprovalGrant, AuditTrailResponse, CostRollup, Device, DeviceEnrolment,
  DeviceGrant, NotificationPreferences, Pagination, PendingEnrolment, PlanHistory, SearchRequest, SearchSettings, SearchUpload, ArtifactRow, RuntimeStatus, SessionUser, Task, TaskBudget,
  TaskDetail, TaskListItem, TaskStateResponse, TimelineEvent,
} from './types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const ACCESS_KEY = 'dc.access_token';
const REFRESH_KEY = 'dc.refresh_token';
const USER_KEY = 'dc.user';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// --- session ---------------------------------------------------------------

const browser = () => typeof window !== 'undefined';

export const session = {
  accessToken: () => (browser() ? window.localStorage.getItem(ACCESS_KEY) : null),
  refreshToken: () => (browser() ? window.localStorage.getItem(REFRESH_KEY) : null),

  user(): SessionUser | null {
    if (!browser()) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  },

  save(access: string, refresh: string | null, user: SessionUser | null) {
    if (!browser()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('dc:session'));
  },

  clear() {
    if (!browser()) return;
    [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach((k) => window.localStorage.removeItem(k));
    window.dispatchEvent(new Event('dc:session'));
  },

  isSignedIn: () => Boolean(browser() && window.localStorage.getItem(ACCESS_KEY)),
};

// --- transport -------------------------------------------------------------

let refreshing: Promise<boolean> | null = null;

/** Exchange the refresh token for a new pair. Returns false if it could not. */
async function refreshSession(): Promise<boolean> {
  const token = session.refreshToken();
  if (!token) return false;

  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token }),
  });
  if (!res.ok) return false;

  const body = await res.json();
  const data = body?.data;
  if (!data?.access_token) return false;

  session.save(data.access_token, data.refresh_token ?? null, data.user ?? session.user());
  return true;
}

function authHeaders(extra?: HeadersInit, multipart = false): HeadersInit {
  const token = session.accessToken();
  return {
    // A multipart body sets its own Content-Type, boundary included.
    ...(multipart ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * One request, with a single retry after a token refresh.
 *
 * `retry` is a flag rather than a loop on purpose: if the refreshed token is
 * also rejected, the session is genuinely dead and looping would just spin on
 * the same 401.
 */
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const multipart = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, { ...init, headers: authHeaders(init.headers, multipart) });

  if (res.status === 401 && retry) {
    refreshing = refreshing || refreshSession().finally(() => { refreshing = null; });
    const ok = await refreshing;
    if (ok) return request<T>(path, init, false);
    session.clear();
    throw new ApiError('Your session has expired — please sign in again.', 401);
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // A non-JSON body on an error (a proxy's HTML 502, say) must not become a
    // parse error that hides the status the caller needs to see.
  }

  if (!res.ok) {
    throw new ApiError(body?.message || `Request failed (${res.status})`, res.status, body?.details);
  }
  return body as T;
}

// --- auth ------------------------------------------------------------------

type AuthBody = { data: { access_token: string; refresh_token?: string; user: SessionUser } };

async function adopt(body: AuthBody) {
  session.save(body.data.access_token, body.data.refresh_token ?? null, body.data.user);
  return body.data.user;
}

export const auth = {
  async signIn(identifier: string, password: string) {
    return adopt(await request<AuthBody>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }, false));
  },

  async register(input: {
    email: string; password: string; first_name: string; last_name: string;
  }) {
    return adopt(await request<AuthBody>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }, false));
  },

  /** Always answers the same way, whether or not the account exists. */
  async forgotPassword(identifier: string) {
    return request<{ message: string; data: { masked_recipient: string } }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }, false);
  },

  /** Completes a reset with the token from the emailed link. Does not sign in. */
  async resetPassword(token: string, newPassword: string) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    }, false);
  },

  /** Email a 6-digit code to the signed-in account's address. */
  async sendEmailCode() {
    const body = await request<{ data: { sent_to: string; already_verified: boolean } }>(
      '/auth/email/verify/initiate', { method: 'POST', body: '{}' },
    );
    return body.data;
  },

  /** Confirm the code; marks the stored session user as verified. */
  async confirmEmailCode(code: string) {
    await request('/auth/email/verify/confirm', { method: 'POST', body: JSON.stringify({ code }) });
    const user = session.user();
    const token = session.accessToken();
    if (user && token) session.save(token, null, { ...user, email_verified: true });
  },

  signOut() {
    session.clear();
  },
};

export const notificationsApi = {
  async preferences() {
    const body = await request<{ data: NotificationPreferences }>('/notifications/preferences');
    return body.data;
  },

  async update(patch: Partial<NotificationPreferences>) {
    const body = await request<{ data: NotificationPreferences }>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    return body.data;
  },
};

// --- public config & health -------------------------------------------------

export interface PublicConfig {
  /** When on, "Create an account" shows the early-access form. */
  early_access: boolean;
}

export const configApi = {
  async get(): Promise<PublicConfig> {
    const body = await request<{ data: PublicConfig }>('/shared/config', {}, false);
    return body.data;
  },

  /** Whether the API answers at all. Never throws. */
  async healthy(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/health`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },
};

// --- search settings ---------------------------------------------------------

export const searchApi = {
  async settings() {
    const body = await request<{ data: SearchSettings }>('/search/settings');
    return body.data;
  },

  /** Choose providers and their order; `[]` goes back to the platform's order. */
  async saveSettings(providers: string[]) {
    const body = await request<{ data: SearchSettings }>('/search/settings', {
      method: 'PUT',
      body: JSON.stringify({ providers }),
    });
    return body.data;
  },

  async pendingCount() {
    const body = await request<{ data: { count: number } }>('/search/pending');
    return body.data.count;
  },
};

// --- admin -----------------------------------------------------------------

export const adminApi = {
  async setSetting(key: string, value: unknown, description?: string) {
    return request<{ data: unknown }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value, description }),
    });
  },
};

// --- tasks -----------------------------------------------------------------

export const tasksApi = {
  async list(params: { status?: string; page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const suffix = q.toString() ? `?${q}` : '';
    // `TaskListItem`, not `Task`: the list endpoint always includes step
    // counts, and typing it as `Task` made two views each re-declare them.
    return request<{ data: TaskListItem[]; pagination: Pagination }>(`/tasks${suffix}`);
  },

  async get(id: string) {
    const body = await request<{ data: TaskDetail }>(`/tasks/${id}`);
    return body.data;
  },

  async create(objective: string, options: { start?: boolean; budget?: Record<string, unknown> } = {}) {
    const body = await request<{ data: Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ objective, ...options }),
    });
    return body.data;
  },

  /** The control verbs (P1-14). Each returns the task as it now stands. */
  async control(id: string, verb: 'pause' | 'resume' | 'cancel', payload: Record<string, unknown> = {}) {
    const body = await request<{ data: Task }>(`/tasks/${id}/${verb}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return body.data;
  },

  /**
   * Retry as a new, linked attempt. `learn` (default on) tells the planner what
   * earlier attempts did; `stop_current` is required for a task still running.
   */
  async retry(id: string, input: {
    objective?: string; note?: string; learn?: boolean; stop_current?: boolean;
  } = {}) {
    const body = await request<{ data: Task }>(`/tasks/${id}/retry`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return body.data;
  },

  /** Searches this task handed to its owner, newest first. */
  async searchRequests(id: string) {
    const body = await request<{ data: SearchRequest[] }>(`/tasks/${id}/search-requests`);
    return body.data;
  },

  /** Answer with what you found — resumes the task. */
  /** Upload a file (.txt .md .csv .html .htm .pdf) as what you found; point an answer at `file`. */
  async uploadSearchFile(id: string, requestId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const body = await request<{ data: SearchUpload }>(
      `/tasks/${id}/search-requests/${requestId}/files`,
      { method: 'POST', body: form },
    );
    return body.data;
  },

  async answerSearch(id: string, requestId: string, input: {
    results: { url?: string; title?: string; content?: string; file?: string }[]; notes?: string;
  }) {
    const body = await request<{ data: { resumed: boolean } }>(
      `/tasks/${id}/search-requests/${requestId}/answer`,
      { method: 'POST', body: JSON.stringify(input) },
    );
    return body.data;
  },

  /** Say you could not find it — the task continues without. */
  async declineSearch(id: string, requestId: string, notes?: string) {
    const body = await request<{ data: { resumed: boolean } }>(
      `/tasks/${id}/search-requests/${requestId}/decline`,
      { method: 'POST', body: JSON.stringify({ notes }) },
    );
    return body.data;
  },

  /** Proposal → policy → approval → execution, over the event log (P3-09). */
  async audit(id: string) {
    const body = await request<{ data: AuditTrailResponse }>(`/tasks/${id}/audit`);
    return body.data;
  },

  /** Where this task's time and money went, per step and in total (P2-10). */
  async cost(id: string) {
    const body = await request<{ data: CostRollup }>(`/tasks/${id}/cost`);
    return body.data;
  },

  /**
   * Where to download a file a task produced (P2-09).
   *
   * A URL rather than a fetch, because the browser should do the downloading —
   * but the endpoint takes a bearer token, so this is paired with `download`
   * below rather than being usable as a plain href.
   */
  artifactUrl(taskId: string, artifactId: string) {
    return `${BASE}/tasks/${taskId}/artifacts/${artifactId}`;
  },

  /** Fetch an artifact's bytes with the session's token, and hand them to the browser. */
  /** A text file's contents, for a preview on the page (the first `maxChars`). */
  async artifactText(taskId: string, artifactId: string, maxChars = 200_000) {
    const res = await fetch(this.artifactUrl(taskId, artifactId), { headers: authHeaders() });
    if (!res.ok) throw new ApiError('Could not load the file', res.status);
    const text = await res.text();
    return { text: text.slice(0, maxChars), truncated: text.length > maxChars };
  },

  async download(taskId: string, artifactId: string, filename: string) {
    const res = await fetch(this.artifactUrl(taskId, artifactId), { headers: authHeaders() });
    if (!res.ok) throw new ApiError(`Could not download ${filename}`, res.status);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    // Revoked, or every download leaks the whole file until the tab closes.
    URL.revokeObjectURL(url);
  },

  /**
   * Change the caps; resumes a task suspended for budget (P2-07).
   *
   * Raising a cap does not reset the spend — a task that has used $1.00 and is
   * given $2.00 has $1.00 left. `still_over` comes back when the new caps do
   * not clear the breach, so the console can say so rather than appear to have
   * ignored the change.
   */
  async setBudget(id: string, caps: Partial<TaskBudget['caps']>) {
    const body = await request<{ data: Task & {resumed: boolean;still_over: string | null;} }>(
      `/tasks/${id}/budget`,
      { method: 'POST', body: JSON.stringify(caps) },
    );
    return body.data;
  },

  /**
   * The projection the model is given (P2-05).
   *
   * The STORED copy by default — what the model was told when it last decided —
   * because that is the question worth asking after a task has done something
   * strange. `fresh` rebuilds it, which answers a different question.
   */
  async state(id: string, { fresh = false }: {fresh?: boolean;} = {}) {
    const body = await request<{ data: TaskStateResponse }>(
      `/tasks/${id}/state${fresh ? '?fresh=1' : ''}`,
    );
    return body.data;
  },

  /**
   * Every version this task's plan has had, and what changed at each (P2-04).
   *
   * Its own call rather than a field on the task: it is a history, and the
   * detail page is a snapshot. A task that never replanned has one entry, and
   * a page showing the current plan should not pay for every plan it has had.
   */
  async plan(id: string) {
    const body = await request<{ data: PlanHistory }>(`/tasks/${id}/plan`);
    return body.data;
  },

  /** The timeline as plain JSON — for a first paint, before a stream attaches. */
  async timeline(id: string, after?: number) {
    const suffix = after !== undefined ? `?after=${after}` : '';
    const body = await request<{
      data: { events: TimelineEvent[]; last_seq: number; status: string };
    }>(`/tasks/${id}/timeline${suffix}`);
    return body.data;
  },
};

/**
 * Approvals (P3-06/07).
 *
 * Its own client surface rather than a corner of `tasksApi`, for the same
 * reason it is its own API module: an approval is a thing a PERSON has, not a
 * thing a task has. The queue is "what is waiting on me" across every task.
 */
export const runtimeApi = {
  /** AI and search providers, the sandbox, the browser worker, computers, recent tasks. */
  async status() {
    const body = await request<{ data: RuntimeStatus }>('/runtime/status');
    return body.data;
  },
};

export const artifactsApi = {
  /** Every file this account's tasks produced, newest first. */
  async list({ page = 1, limit = 25 }: { page?: number; limit?: number } = {}) {
    const body = await request<{ data: { artifacts: ArtifactRow[]; pagination: Pagination } }>(
      `/artifacts?page=${page}&limit=${limit}`,
    );
    return body.data;
  },
};

export const approvalsApi = {
  async list() {
    const body = await request<{ data: Approval[] }>('/approvals');
    return body.data;
  },

  /**
   * Answer one. `scope` is part of the answer rather than something asked for
   * up front — a person decides how far their yes goes having seen what it
   * applies to.
   */
  async decide(id: string, {
    granted, scope = 'once', note, broaden




  }: {granted: boolean;scope?: 'once' | 'task' | 'always';note?: string;broaden?: boolean;}) {
    const body = await request<{ data: Approval & {resumed: boolean;grant_id: string | null;} }>(
      `/approvals/${id}/decide`,
      { method: 'POST', body: JSON.stringify({ granted, scope, note, broaden }) },
    );
    return body.data;
  },

  async grants() {
    const body = await request<{ data: ApprovalGrant[] }>('/approvals/grants');
    return body.data;
  },

  async revokeGrant(id: string) {
    await request(`/approvals/grants/${id}`, { method: 'DELETE' });
  },
};

/**
 * Devices (P4-08) — §8.
 *
 * Its own surface for the same reason approvals are: a computer belongs to a
 * person, not to a task.
 *
 * NOTE `enrol()` RETURNS THE CODE ONCE. The API stores only a hash and has no
 * endpoint that reads one back, so a caller that drops this value cannot
 * recover it — the remedy is to issue another. That is deliberate on the API
 * side and is why the view holds it in component state rather than re-fetching.
 */
export const devicesApi = {
  async list({ includeRevoked = false } = {}) {
    const body = await request<{ data: Device[] }>(
      `/devices${includeRevoked ? '?include_revoked=true' : ''}`,
    );
    return body.data;
  },

  async get(id: string) {
    const body = await request<{ data: Device }>(`/devices/${id}`);
    return body.data;
  },

  /** Issue a short-lived code. The plaintext is in this response and nowhere else. */
  async enrol(name?: string) {
    const body = await request<{ data: DeviceEnrolment }>('/devices/enrol', {
      method: 'POST',
      body: JSON.stringify(name ? { name } : {}),
    });
    return body.data;
  },

  async pending() {
    const body = await request<{ data: PendingEnrolment[] }>('/devices/pending');
    return body.data;
  },

  async rename(id: string, name: string) {
    const body = await request<{ data: Device }>(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    return body.data;
  },

  async revoke(id: string, reason?: string) {
    const body = await request<{ data: Device }>(`/devices/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(reason ? { reason } : {}),
    });
    return body.data;
  },

  async grants(deviceId?: string) {
    const body = await request<{ data: DeviceGrant[] }>(
      deviceId ? `/devices/${deviceId}/grants` : '/devices/grants',
    );
    return body.data;
  },

  async grant(deviceId: string, input: {
    capability: string;
    scope?: Record<string, unknown>;
    grant_scope?: 'task' | 'always';
    task_id?: string;
    expires_at?: string;
  }) {
    const body = await request<{ data: DeviceGrant }>(`/devices/${deviceId}/grants`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return body.data;
  },

  async revokeGrant(id: string) {
    await request(`/devices/grants/${id}`, { method: 'DELETE' });
  },
};

// --- the event stream ------------------------------------------------------

// --- early access (public) ---------------------------------------------------

export interface EarlyAccessRequest {
  name: string;
  email: string;
  company?: string;
  task: string;
  source?: string;
  /** Hidden from people; only a bot fills it. */
  website?: string;
}

export const earlyAccessApi = {
  /** Answered the same whether the address is new or has asked before. */
  submit: (body: EarlyAccessRequest) =>
  request<{ success: boolean; message: string }>('/early-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }, false)
};

export interface StreamHandle {
  close: () => void;
}

/**
 * Subscribe to a task's event stream (P1-13).
 *
 * NOT `EventSource`. The browser's EventSource cannot set headers, and this API
 * authenticates with `Authorization: Bearer` — the alternative would be a token
 * in the query string, which writes credentials into access logs and Referer
 * headers. So the stream is read with `fetch` and a `ReadableStream`, which
 * also means the reconnect is ours to implement rather than the browser's.
 *
 * Reconnect resumes from the last `seq` seen, via `Last-Event-ID`, so a dropped
 * connection costs the events it missed and not the whole timeline.
 */
export function streamTaskEvents(
  taskId: string,
  handlers: {
    onEvent: (event: TimelineEvent) => void;
    onEnd?: (info: { status: string; last_seq: number }) => void;
    onError?: (err: Error) => void;
  },
  options: { after?: number } = {},
): StreamHandle {
  let closed = false;
  let cursor = options.after ?? 0;
  let controller: AbortController | null = null;

  async function connect(attempt = 0) {
    if (closed) return;
    controller = new AbortController();

    try {
      const res = await fetch(`${BASE}/tasks/${taskId}/events`, {
        headers: authHeaders(cursor > 0 ? { 'Last-Event-ID': String(cursor) } : undefined),
        signal: controller.signal,
      });

      if (res.status === 401) {
        const ok = await (refreshing || (refreshing = refreshSession().finally(() => { refreshing = null; })));
        if (!ok) throw new ApiError('Session expired', 401);
        return connect(attempt); // same cursor — nothing was missed
      }
      if (!res.ok || !res.body) throw new ApiError(`Stream failed (${res.status})`, res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // SSE frames are separated by a blank line. Buffer until a whole one has
      // arrived — a chunk boundary can land anywhere, including mid-JSON.
      for (;;) {
        // eslint-disable-next-line no-await-in-loop
        const { value, done } = await reader.read();
        if (done || closed) break;
        buffer += decoder.decode(value, { stream: true });

        let split = buffer.indexOf('\n\n');
        while (split !== -1) {
          const raw = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);
          handleFrame(raw);
          split = buffer.indexOf('\n\n');
        }
      }
      if (!closed) scheduleReconnect(attempt + 1);
    } catch (err) {
      if (closed || (err as Error).name === 'AbortError') return;
      handlers.onError?.(err as Error);
      scheduleReconnect(attempt + 1);
    }
  }

  function handleFrame(raw: string) {
    // Comment lines are the server's keepalive; there is nothing to do with one
    // except notice the connection is still there.
    if (!raw.trim() || raw.startsWith(':')) return;

    let type = 'message';
    let data = '';
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) type = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (!data) return;

    if (type === 'end') {
      closed = true;
      controller?.abort();
      try { handlers.onEnd?.(JSON.parse(data)); } catch { /* malformed close frame */ }
      return;
    }
    if (type === 'error') {
      try { handlers.onError?.(new Error(JSON.parse(data).message)); } catch { /* ignore */ }
      return;
    }

    try {
      const event = JSON.parse(data) as TimelineEvent;
      // Advance the cursor only on a successfully parsed event, so a malformed
      // frame cannot make the reconnect skip past events it never delivered.
      cursor = event.seq;
      handlers.onEvent(event);
    } catch { /* not an event frame */ }
  }

  function scheduleReconnect(attempt: number) {
    if (closed) return;
    // Backs off so a server that is down is not hammered by every open tab.
    const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 30000);
    setTimeout(() => connect(attempt), delay);
  }

  connect();

  return {
    close() {
      closed = true;
      controller?.abort();
    },
  };
}

export { BASE as API_BASE };
