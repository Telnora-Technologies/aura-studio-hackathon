export const runtime = 'nodejs';

export async function GET(request) {
  const backendBase = process.env.AURA_BACKEND_URL;
  if (!backendBase) {
    return new Response(
      JSON.stringify({ error: 'AURA_BACKEND_URL is not configured on the frontend service.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = `${backendBase.replace(/\/$/, '')}/session`;
  const authHeader = request.headers.get('authorization');
  const upstream = await fetch(url, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}
