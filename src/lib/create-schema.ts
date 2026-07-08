import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*['"]?(.+?)['"]?\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
} catch {}

import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) { console.log('Missing credentials'); process.exit(1); }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Try calling version() to test RPC
  const { data: v, error: ve } = await supabase.rpc('version');
  console.log('Version:', v, 'Error:', ve?.message);

  // Try querying available schemas
  const { data: d, error: de } = await supabase.from('information_schema.schemata').select('schema_name');
  console.log('Schemas:', JSON.stringify(d), 'Error:', de?.message);
}

main().then(() => process.exit(0));
