import { createClient } from '@supabase/supabase-js';

const url =
  process.env.VITE_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const key =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY in env');
  process.exit(1);
}

const sb = createClient(url, key);
const projection = "id, public_id, title, category, sub_category, category_id, categories:category_id(name, path_text)";

const { data, error } = await sb.from('rfqs').select(projection).limit(5);
if (error) {
  console.error('Query error:', error);
  process.exit(2);
}
console.log(JSON.stringify(data, null, 2));
