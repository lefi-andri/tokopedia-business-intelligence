# Tokopedia Business Intelligence Dashboard

Dashboard analitik untuk memantau performa produk dan sentimen ulasan Tokopedia. Aplikasi dibangun menggunakan Laravel 13, Inertia.js, React, Tailwind CSS, dan MariaDB. Dataset CSV diimpor ke database agar pemfilteran dan penyajian dashboard lebih cepat.

## Kebutuhan sistem

Pastikan perangkat sudah memiliki:

- PHP 8.5 atau lebih baru beserta ekstensi yang dibutuhkan Laravel.
- Composer.
- Node.js 20 atau lebih baru dan npm.
- MariaDB atau MySQL.

## Instalasi

1. Masuk ke folder proyek.

   ```bash
   cd dddm
   ```

2. Instal dependensi backend dan frontend.

   ```bash
   composer install
   npm install
   ```

3. Buat file konfigurasi lingkungan.

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Linux atau macOS:

   ```bash
   cp .env.example .env
   ```

4. Buat application key.

   ```bash
   php artisan key:generate
   ```

## Konfigurasi database

1. Buat database MariaDB/MySQL, misalnya:

   ```sql
   CREATE DATABASE master_inertia_11
       CHARACTER SET utf8mb4
       COLLATE utf8mb4_unicode_ci;
   ```

2. Sesuaikan koneksi berikut pada `.env`.

   ```dotenv
   DB_CONNECTION=mariadb
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=master_inertia_11
   DB_USERNAME=root
   DB_PASSWORD=
   ```

3. Buat tabel aplikasi dan data pengguna awal.

   ```bash
   php artisan migrate --seed
   ```

Seeder membuat pengguna berikut:

- Email: `test@example.com`
- Password: `password`

Dashboard dapat dibuka tanpa login. Akun tersebut disediakan untuk halaman profil dan fitur autentikasi.

## Mengimpor dataset CSV

Dataset bawaan berada di:

```text
study-dddm/1. ETL - Extract, Transform, Load/clean_dataset.csv
```

Impor dataset tersebut ke database:

```bash
php artisan dashboard:import
```

Untuk menggunakan file CSV lain, atur lokasi absolutnya di `.env`:

```dotenv
BI_DATASET_PATH="D:/path/to/clean_dataset.csv"
```

Kemudian jalankan kembali:

```bash
php artisan dashboard:import
```

Lokasi file juga dapat diberikan langsung:

```bash
php artisan dashboard:import "D:/path/to/clean_dataset.csv"
```

Perintah impor akan dilewati jika file belum berubah. Gunakan opsi `--force` untuk mengimpor ulang:

```bash
php artisan dashboard:import --force
```

## Menjalankan aplikasi

Cara paling praktis adalah menjalankan seluruh proses pengembangan sekaligus:

```bash
composer run dev
```

Perintah tersebut menjalankan server Laravel, Vite, queue listener, dan log viewer. Buka:

```text
http://127.0.0.1:8000
```

Sebagai alternatif, jalankan pada dua terminal terpisah:

Terminal pertama:

```bash
php artisan serve
```

Terminal kedua:

```bash
npm run dev
```

## Build produksi

```bash
npm run build
php artisan optimize
```

Pastikan web server mengarah ke direktori `public`, lalu gunakan `APP_ENV=production` dan `APP_DEBUG=false` pada server produksi.

## Pengujian

```bash
php artisan test
```

## Perintah yang sering digunakan

```bash
# Menghapus cache konfigurasi dan aplikasi
php artisan optimize:clear

# Menjalankan ulang seluruh migrasi dan seeder
php artisan migrate:fresh --seed

# Mengimpor ulang dataset
php artisan dashboard:import --force
```

> `migrate:fresh` menghapus seluruh tabel dan data pada database yang sedang digunakan. Jalankan hanya pada lingkungan pengembangan.

## Pemecahan masalah

- **Koneksi database gagal:** pastikan MariaDB/MySQL aktif dan nilai `DB_*` pada `.env` benar.
- **Dataset tidak ditemukan:** periksa `BI_DATASET_PATH` atau gunakan argumen lokasi CSV secara langsung.
- **Perubahan `.env` belum terbaca:** jalankan `php artisan optimize:clear`.
- **Tampilan frontend tidak berubah:** pastikan `npm run dev` aktif atau jalankan kembali `npm run build`.
- **Dashboard belum memiliki data:** jalankan `php artisan migrate`, kemudian `php artisan dashboard:import`.
