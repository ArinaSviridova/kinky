import { requireAdmin } from './_shared/auth';
import { error, json, parseBody } from './_shared/http';
import { cleanupPartyData } from './_shared/party';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);
  try {
    await requireAdmin(event, ['owner', 'admin']);
    const { partyId } = parseBody(event);
    if (!partyId) return error('partyId required', 400);
    await cleanupPartyData(partyId);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
