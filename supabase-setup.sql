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


-- ============================================================
-- UPDATE #2: edit-on-resubmit + admin.html (jalankan sekali lagi
-- di SQL Editor, sama seperti langkah di atas)
-- ============================================================

-- guest_key = nilai ?to= (huruf kecil), dipakai untuk mendeteksi tamu yang
-- sama supaya isi form-nya bisa diedit alih-alih bikin baris duplikat.
alter table rsvp add column if not exists guest_key text;

-- Ukuran custom (dada/pinggang/pinggul/tinggi) sudah ditanya di form tapi
-- belum pernah disimpan ke Supabase — dibutuhkan supaya admin.html bisa
-- menampilkannya.
alter table rsvp add column if not exists dada text;
alter table rsvp add column if not exists pinggang text;
alter table rsvp add column if not exists pinggul text;
alter table rsvp add column if not exists tinggi text;

-- Guest bisa mengedit isian sendiri (dicocokkan lewat guest_key), dan
-- admin.html bisa menghapus baris. anon key memang publik (ada di kode
-- situs), jadi ini keputusan sadar untuk situs kecil tanpa login.
create policy "public can update rsvp" on rsvp
  for update to anon using (true) with check (true);

create policy "public can delete rsvp" on rsvp
  for delete to anon using (true);
