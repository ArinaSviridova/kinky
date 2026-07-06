import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const supabase = supabaseAdmin();
    const { data: admin } = await supabase.from('admin_users').select('*').eq('app_user_id', user.id).eq('is_active', true).maybeSingle();
    return json({ user, isAdmin: Boolean(admin), adminRole: admin?.role || null });
  } catch {
    return error('Unauthorized', 401);
  }
}
