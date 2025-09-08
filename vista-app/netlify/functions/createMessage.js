import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../src/lib/jwtHandler.js'; // jen verifyToken

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const json = (statusCode, bodyObj) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(bodyObj),
});

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  try {
    const { title, content } = JSON.parse(event.body || '{}');
    if (!title?.trim() || !content?.trim()) return json(400, { error: 'Missing title/content' });
    if (title.length > 120) return json(400, { error: 'Title too long' });
    if (content.length > 5000) return json(400, { error: 'Content too long' });

    // token z cookie / Authorization
    const rawCookie = event.headers.cookie || '';
    const cookieMatch = rawCookie.match(/(?:^|;\s*)authToken=([^;]+)/);
    const token =
      (cookieMatch ? decodeURIComponent(cookieMatch[1]) : null) ||
      (event.headers.authorization || '').replace(/^Bearer\s+/i, '');

    if (!token) return json(401, { error: 'No auth token' });

    // 🔐 Secret pro backend: z process.env.APP_JWT_SECRET (stejná hodnota jako VITE_JWT_SECRET ve frontendu)
    const appSecret = process.env.APP_JWT_SECRET;
    if (!appSecret) return json(500, { error: 'APP_JWT_SECRET is not set on the server' });
    const secretBytes = new TextEncoder().encode(appSecret);

    // ověř JWT (použijeme náš secretBytes)
    const payload = await verifyToken(token, secretBytes);
    if (!payload?.email || payload?.verified !== true) {
      return json(401, { error: 'Invalid token' });
    }

    // ověření admina
    const { data: usr, error: uerr } = await supabase
      .from('User')   // podle tvé DB
      .select('admin')
      .eq('email', payload.email)
      .single();

    if (uerr) return json(500, { error: `User check failed: ${uerr.message}` });
    if (!usr?.admin) return json(403, { error: 'Not admin' });

    // INSERT zprávy
    const { data, error } = await supabase
      .from('Messages')  // podle tvé DB
      .insert([{ title: title.trim(), content: content.trim() }])
      .select()
      .single();

    if (error) return json(500, { error: `Insert failed: ${error.message}` });

    return json(200, { ok: true, message: data });
  } catch (e) {
    return json(500, { error: e.message || 'Server error' });
  }
}
