import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { requirePartyAccess } from './_shared/party';
import { notifyMatch } from './_shared/telegram';

function orderedPair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const { partyId, toProfileId } = parseBody(event);
    if (!partyId || !toProfileId) return error('partyId and toProfileId required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: myProfile, error: myProfileError } = await supabase
      .from('party_profiles')
      .select('id,user_id,is_visible,is_blocked')
      .eq('party_id', partyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (myProfileError) return error(myProfileError.message, 500);
    if (!myProfile) return error('Сначала создайте свою анкету', 403);
    if (myProfile.is_blocked || !myProfile.is_visible) return error('Ваша анкета скрыта или заблокирована', 403);
    if (myProfile.id === toProfileId) return error('Нельзя поставить match своей анкете', 400);

    const { data: target, error: targetError } = await supabase
      .from('party_profiles')
      .select('id,user_id,nickname,telegram_username')
      .eq('id', toProfileId)
      .eq('party_id', partyId)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .maybeSingle();

    if (targetError) return error(targetError.message, 500);
    if (!target) return error('Анкета не найдена', 404);

    const { error: likeError } = await supabase
      .from('profile_likes')
      .upsert(
        { party_id: partyId, from_profile_id: myProfile.id, to_profile_id: toProfileId },
        { onConflict: 'from_profile_id,to_profile_id' },
      );

    if (likeError) return error(likeError.message, 500);

    const { data: reciprocal, error: reciprocalError } = await supabase
      .from('profile_likes')
      .select('id')
      .eq('party_id', partyId)
      .eq('from_profile_id', toProfileId)
      .eq('to_profile_id', myProfile.id)
      .maybeSingle();

    if (reciprocalError) return error(reciprocalError.message, 500);

    let matched = false;
    let matchId = '';

    if (reciprocal) {
      const [profile_a_id, profile_b_id] = orderedPair(myProfile.id, toProfileId);

      const { data: existingMatch, error: existingMatchError } = await supabase
        .from('profile_matches')
        .select('id')
        .eq('party_id', partyId)
        .eq('profile_a_id', profile_a_id)
        .eq('profile_b_id', profile_b_id)
        .maybeSingle();

      if (existingMatchError) return error(existingMatchError.message, 500);

      if (existingMatch) {
        matched = true;
        matchId = existingMatch.id;
      } else {
        const { data: matchRow, error: matchError } = await supabase
          .from('profile_matches')
          .insert({ party_id: partyId, profile_a_id, profile_b_id })
          .select('id')
          .single();

        if (matchError) return error(matchError.message, 500);

        matched = true;
        matchId = matchRow?.id || `${profile_a_id}:${profile_b_id}`;
        await notifyMatch({
          partyId,
          profileAUserId: myProfile.user_id,
          profileBUserId: target.user_id,
          matchId,
        });
      }
    }

    return json({
      ok: true,
      matched,
      matchId: matchId || null,
      telegram_username: matched ? target.telegram_username : null,
    });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
