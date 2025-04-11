import { createClient } from '@supabase/supabase-js';

// Vlož vlastní klíče z https://app.supabase.com/project/_/settings/api
const supabaseUrl = 'https://zxsvajhcstsrptvcpolx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4c3Zhamhjc3RzcnB0dmNwb2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTk0ODMsImV4cCI6MjA1OTkzNTQ4M30.u60kHlQAd0gP2P4GHDZyXqbe3Xq2FP2iXvZoJ5i5fcY';

export const supabase = createClient(supabaseUrl, supabaseKey);
