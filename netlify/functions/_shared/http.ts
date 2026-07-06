export function json(body: unknown, statusCode = 200, headers: Record<string, string> = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export function error(message: string, statusCode = 400) {
  return json({ error: message }, statusCode);
}

export function parseBody(event: any) {
  if (!event.body) return {};
  try { return JSON.parse(event.body); } catch { return {}; }
}
