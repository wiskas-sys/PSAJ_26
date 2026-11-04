import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Supabase URL or Service Role Key missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_USERS = [
  {
    email: 'owner@dianmotor.co.id',
    password: 'owner123',
    fullName: 'Owner Utama Dian Motor',
    role: 'admin',
  },
  {
    email: 'owner2@dianmotor.co.id',
    password: 'owner123',
    fullName: 'Co-Owner Dian Motor',
    role: 'admin',
  },
  {
    email: 'owner3@dianmotor.co.id',
    password: 'owner123',
    fullName: 'Supervisor Dian Motor',
    role: 'admin',
  },
  {
    email: 'kasir@dianmotor.co.id',
    password: 'kasir123',
    fullName: 'Kasir Shift Dian Motor',
    role: 'kasir',
  },
];

async function setup() {
  console.log('--- Sinkronisasi Akun Owner & Kasir ---');
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Gagal mengambil daftar user:', listError.message);
    return;
  }

  const existingMap = new Map();
  for (const u of userList.users) {
    existingMap.set(u.email.toLowerCase(), u);
    console.log(`User terdaftar: ${u.email} (${u.id})`);
  }

  for (const target of TARGET_USERS) {
    const email = target.email.toLowerCase();
    let userId = null;

    if (existingMap.has(email)) {
      const u = existingMap.get(email);
      userId = u.id;
      console.log(`Mengupdate user: ${email}...`);
      await supabase.auth.admin.updateUserById(userId, {
        password: target.password,
        user_metadata: { full_name: target.fullName },
        email_confirm: true,
      });
    } else {
      console.log(`Membuat user baru: ${email}...`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: target.password,
        user_metadata: { full_name: target.fullName },
        email_confirm: true,
      });
      if (createError) {
        console.error(`Gagal membuat ${email}:`, createError.message);
        continue;
      }
      userId = newUser.user.id;
    }

    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            full_name: target.fullName,
            role: target.role,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        console.error(`Gagal upsert profile untuk ${email}:`, profileError.message);
      } else {
        console.log(`✓ Berhasil setting profile ${email} sebagai role [${target.role}]`);
      }
    }
  }

  console.log('\nSinkronisasi selesai!');
}

setup().catch(console.error);
