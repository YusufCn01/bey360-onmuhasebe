import { createClient } from '@supabase/supabase-js';

// Hostinger'ın dağıtım sırasında otomatik olarak sağlayacağı ortam değişkenleri
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);