import { createClient } from '@supabase/supabase-js';
import { verifyToken, getSecretKey } from '../../src/lib/jwtHandler.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // !! service role, NE anon key
);

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { title, content } = JSON.parse(event.body || '{}');
    if (!title?.trim() || !content?.trim()) {
      return { statusCode: 400, body: 'Missing title/content' };
    }

    // vezmi tvůj app JWT z cookie/hlavičky
    const token = event.headers.cookie?.match(/authToken=([^;]+)/)?.[1]
               || event.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return { statusCode: 401, body: 'No auth token' };

    const payload = await verifyToken(token, getSecretKey());
    if (!payload?.email || payload?.verified !== true) {
      return { statusCode: 401, body: 'Invalid token' };
    }

    // ověření admina v DB
    const { data: usr, error: uerr } = await supabase
      .from('User')
      .select('admin')
      .eq('email', payload.email)
      .single();

    if (uerr) return { statusCode: 500, body: `User check failed: ${uerr.message}` };
    if (!usr?.admin) return { statusCode: 403, body: 'Not admin' };

    // INSERT zprávy (service role obejde RLS)
    const { data, error } = await supabase
      .from('Messages')
      .insert([{ title: title.trim(), content: content.trim() }])
      .select()
      .single();

    if (error) return { statusCode: 500, body: `Insert failed: ${error.message}` };

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, body: e.message || 'Server error' };
  }
}
