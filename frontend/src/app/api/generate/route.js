export const runtime = 'nodejs';

export async function POST(request) {
  const backendBase = process.env.AURA_BACKEND_URL;
  if (!backendBase) {
    return new Response(
      JSON.stringify({ error: 'AURA_BACKEND_URL is not configured on the frontend service.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = `${backendBase.replace(/\/$/, '')}/generate`;

  let payload;
  const rawBody = await request.text();
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
    // Some clients/proxies can send a JSON-encoded string containing JSON.
    // Example rawBody: "{\"prompt\":\"...\"}" -> first parse yields a string.
    if (typeof payload === 'string') {
      payload = JSON.parse(payload);
    }
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: 'Invalid JSON body sent to /api/generate',
        sample: rawBody?.slice?.(0, 200) || '',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!payload || typeof payload !== 'object') {
    return new Response(
      JSON.stringify({ error: 'Missing JSON payload for /api/generate' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = request.headers.get('authorization');

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });

  // If upstream fails early (e.g. JSON parsing, auth), forward the error body
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'text/plain' },
    });
  }

  // Pass through streaming body (SSE)
  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'no-cache');

  const sessionId = upstream.headers.get('x-session-id');
  if (sessionId) headers.set('X-Session-Id', sessionId);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
