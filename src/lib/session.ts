import { api, clearApiCache } from './api';

export type CurrentSession = {
  user: any | null;
  isAdmin: boolean;
  adminRole: string | null;
};

let cachedSession: CurrentSession | null = null;
let pendingSession: Promise<CurrentSession> | null = null;

export async function loadSession(force = false): Promise<CurrentSession> {
  if (!force && cachedSession) return cachedSession;
  if (!force && pendingSession) return pendingSession;

  pendingSession = api<CurrentSession>('me')
    .then((session) => {
      cachedSession = session;
      return session;
    })
    .catch(() => {
      cachedSession = { user: null, isAdmin: false, adminRole: null };
      return cachedSession;
    })
    .finally(() => {
      pendingSession = null;
    });

  return pendingSession;
}

export function resetSession() {
  cachedSession = null;
  pendingSession = null;
  clearApiCache();
}
