import { clearSessionCookie } from './_shared/auth';
import { json } from './_shared/http';

export async function handler() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
