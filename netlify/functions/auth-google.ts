import { supabaseAdmin } from './_shared/supabase';
import { createSessionToken, sessionCookie } from './_shared/auth';
import { error, json, parseBody } from './_shared/http';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  const { access_token } = parseBody(event);
  if (!access_token) return error('No access token', 400);

  const supabase = supabaseAdmin();
  const { data, error: userError } = await supabase.auth.getUser(access_token);
  const email = data.user?.email;

  if (userError || !email) return error('Invalid Google session', 401);

  let { data: user } = await supabase.from('app_users').select('*').eq('google_email', email).maybeSingle();

  if (!user) {
    const { data: created, error: createError } = await supabase
      .from('app_users')
      .insert({
        auth_provider: 'google',
        google_email: email,
        display_name: data.user.user_metadata?.full_name || email,
        avatar_url: data.user.user_metadata?.avatar_url || null,
      })
      .select('*')
      .single();

    if (createError) return error(createError.message, 500);
    user = created;
  } else {
    await supabase.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
  }

  const token = createSessionToken({ userId: user.id, provider: 'google', googleEmail: email, createdAt: Date.now() });
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token) });
}
