# get-carbuddy

Landing page CarBuddy: aplikasi Android untuk mencatat odometer, BBM, servis, pajak, dan asuransi kendaraan. Data disimpan di HP sendiri, tanpa akun.

Halaman ini live di [https://azmirizkifar20.github.io/get-carbuddy/](https://azmirizkifar20.github.io/get-carbuddy/).

## Isi

| Berkas | Untuk apa |
| --- | --- |
| `index.html` | Halaman utama: fitur, galeri, FAQ, dan pendaftaran uji coba tertutup. |
| `privacy.html` | Kebijakan privasi. Wajib ada sebelum aplikasi masuk Play Store. |
| `terms.html` | Syarat dan ketentuan, termasuk harga lisensi. |
| `styles.css` | Seluruh gaya halaman, dipakai bersama oleh ketiga halaman di atas. |
| `app.js` | Interaksi halaman utama: overlay sambutan, galeri, wizard, FAQ, dan formulir pendaftaran. |
| `legal.js` | Penanda bagian aktif di daftar isi `privacy.html` dan `terms.html`. |
| `images/` | Tangkapan layar aplikasi dan ikon. |

## Catatan penting saat mengubah halaman

`app.js` menambahkan kelas `js` ke `<html>`, dan CSS menyembunyikan `.reveal` selama kelas itu ada (`html.js .reveal { opacity: 0 }`). Artinya:

- `index.html` **wajib** memuat `app.js`. Tanpa itu, seluruh isi yang memakai `.reveal` tidak akan pernah muncul.
- `privacy.html` dan `terms.html` **tidak boleh** memuat `app.js`, dan memang tidak memakai kelas `.reveal`. Keduanya memuat `legal.js`, yang terpisah justru karena alasan ini: skrip itu hanya menyentuh daftar isi, jadi ia aman di halaman yang tidak punya animasi masuk.

Kalau menambah halaman baru, pilih salah satu: muat `app.js` dan pakai `.reveal`, atau jangan muat `app.js` dan jangan pakai `.reveal`. Kombinasi setengah-setengah menghasilkan halaman kosong.

Daftar isi di halaman legal tetap berfungsi tanpa JavaScript: tautannya tetap melompat ke bagian yang benar, hanya penanda "sedang dibaca" yang tidak muncul.

## Overlay sambutan tidak tampil setelah dari halaman legal

Overlay di `index.html` dilewati kalau pengunjung datang dari `privacy.html` atau `terms.html`. Yang dipakai adalah `document.referrer`, bukan penanda di tiap tautan, supaya semua jalan balik ikut tercegat sekaligus: tombol "kembali ke beranda", logo merek, tombol Early Access di navbar, dan tautan footer. Deteksinya menerima nama berkas dengan maupun tanpa `.html`, karena GitHub Pages menyajikan `/privacy` sementara server lokal menyajikannya sebagai `privacy.html`.

## Cara mencoba di lokal

```
python -m http.server 8899
```

Lalu buka `http://127.0.0.1:8899/`. URL tanpa ekstensi (mis. `/privacy`) hanya berfungsi di GitHub Pages, bukan di server lokal.

## Pendaftaran uji coba

Formulir di `#beta` tidak punya backend. Isinya disusun menjadi pesan, lalu diserahkan ke WhatsApp atau email, dan pendaftar sendiri yang menekan kirim. Nomor WhatsApp dan alamat email pengembang ada di bagian atas blok `#beta` di `app.js`.
