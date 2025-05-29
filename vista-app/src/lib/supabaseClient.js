import { createClient } from '@supabase/supabase-js';

console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
    throw new Error('Chybí Supabase URL nebo klíč! Zkontroluj .env soubor.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);


