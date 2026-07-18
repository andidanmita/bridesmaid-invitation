-- Setup untuk Wishes Wall + RSVP form (Supabase)
--
-- 1. Buat akun/project baru di https://supabase.com (gratis, tanpa kartu kredit).
-- 2. Di dashboard project: buka "SQL Editor" > New query > paste SEMUA isi
--    file ini > klik Run.
-- 3. Buka "Project Settings" > "API" — copy dua nilai ini:
--      - "Project URL"      -> jadi SUPABASE_URL di script.js
--      - "anon public" key  -> jadi SUPABASE_ANON_KEY di script.js
-- 4. Kirim dua nilai itu ke saya (atau paste sendiri ke script.js
--    menggantikan 'PASTE_YOUR_SUPABASE_...').

create table if not exists rsvp (
  id bigint generated always as identity primary key,
  waktu timestamptz default now(),
  nama text,
  konfirmasi text,
  ukuran text,
  hijab text,
  catatan text,
  ucapan text
);

alter table rsvp enable row level security;

-- Form publik: siapa saja (belum login) boleh menambah baris baru...
create policy "public can insert rsvp" on rsvp
  for insert to anon
  with check (true);

-- ...dan boleh membaca semua baris (dipakai slide "Words From You").
create policy "public can read rsvp" on rsvp
  for select to anon
  using (true);
