const { createClient } = require('@supabase/supabase-js');

// Mevcut .env dosyanızdaki ayarları otomatik olarak alacak şekilde güncellendi
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Bağlantıyı test et ('todos' tablosu üzerinden)
supabase
  .from('todos')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) console.error('Supabase Bağlantı Hatası:', error.message);
    else console.log('Supabase Başarıyla Bağlandı! Çekilen Veri:', data);
  });

module.exports = supabase;