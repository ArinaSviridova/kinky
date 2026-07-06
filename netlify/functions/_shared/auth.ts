import crypto from 'node:crypto';
import { supabaseAdmin } from './supabase';

export type AppSession = {
  userId: string;
  provider: string;
  telegramId?: string;
  googleEmail?: string;
  createdAt: number;
};

export function createSessionToken(payload: AppSession) {
  const secret = process.env.APP_SESSION_SECRET!;
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string): AppSession | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = crypto.createHmac('sha256', process.env.APP_SESSION_SECRET!).update(body).digest('base64url');
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AppSession;
  if (Date.now() - payload.createdAt > 7 * 24 * 60 * 60 * 1000) return null;
  return payload;
}

export function getCookie(header: string | undefined, name: string) {
  if (!header) return null;
  const part = header.split(';').map((v) => v.trim()).find((v) => v.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

export function sessionCookie(token: string) {
  return `party_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}

export function clearSessionCookie() {
  return 'party_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

export async function requireUser(event: any) {
  const cookie = getCookie(event.headers.cookie, 'party_session');
  const session = cookie ? verifySessionToken(cookie) : null;
  if (!session) throw new Error('UNAUTHORIZED');

  const supabase = supabaseAdmin();
  const { data: user, error } = await supabase.from('app_users').select('*').eq('id', session.userId).single();
  if (error || !user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin(event: any, allowedRoles = ['owner', 'admin', 'moderator', 'editor']) {
  const user = await requireUser(event);
  const supabase = supabaseAdmin();
  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('app_user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!admin || !allowedRoles.includes(admin.role)) throw new Error('FORBIDDEN');
  return { user, admin };
}
