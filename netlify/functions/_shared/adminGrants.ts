import { supabaseAdmin } from './supabase';

const roleRank: Record<string, number> = {
  editor: 1,
  moderator: 2,
  admin: 3,
  owner: 4,
};

function bestRole(roles: string[]) {
  return roles.filter(Boolean).sort((a, b) => (roleRank[b] || 0) - (roleRank[a] || 0))[0] || 'admin';
}

export function normalizeAdminIdentifier(identifier: string) {
  const rawIdentifier = String(identifier || '').trim();
  const isEmail = rawIdentifier.includes('@') && !rawIdentifier.startsWith('@');
  const value = isEmail
    ? rawIdentifier.toLowerCase()
    : rawIdentifier.replace(/^@/, '').trim().toLowerCase();

  return { value, isEmail };
}

export async function activatePendingAdminGrants(user: any) {
  if (!user?.id) return;

  const supabase = supabaseAdmin();
  const email = user.google_email ? String(user.google_email).toLowerCase() : '';
  const telegramUsername = user.telegram_username ? String(user.telegram_username).replace(/^@/, '').toLowerCase() : '';
  const filters: string[] = [];
  if (email) filters.push(`pending_email.eq.${email}`);
  if (telegramUsername) filters.push(`pending_telegram_username.eq.${telegramUsername}`);
  if (!filters.length) return;

  const { data: pendingRows } = await supabase
    .from('admin_users')
    .select('*')
    .is('app_user_id', null)
    .eq('is_active', true)
    .or(filters.join(','));

  if (!pendingRows?.length) return;

  const { data: existing } = await supabase
    .from('admin_users')
    .select('*')
    .eq('app_user_id', user.id)
    .maybeSingle();

  const targetRole = bestRole([
    existing?.role,
    ...pendingRows.map((row: any) => row.role),
  ]);

  if (existing) {
    await supabase
      .from('admin_users')
      .update({ role: targetRole, is_active: true })
      .eq('id', existing.id);
    await supabase
      .from('admin_users')
      .delete()
      .in('id', pendingRows.map((row: any) => row.id));
    return;
  }

  const [mainPending, ...extraPending] = pendingRows;
  await supabase
    .from('admin_users')
    .update({
      app_user_id: user.id,
      role: targetRole,
      is_active: true,
    })
    .eq('id', mainPending.id);

  if (extraPending.length) {
    await supabase
      .from('admin_users')
      .delete()
      .in('id', extraPending.map((row: any) => row.id));
  }
}
