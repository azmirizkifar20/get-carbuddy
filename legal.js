// Penanda bagian aktif di daftar isi halaman legal (privasi dan ketentuan).
//
// Berkas terpisah, bukan bagian dari app.js: halaman legal sengaja tidak memuat
// app.js, karena skrip itu menambahkan kelas .js ke <html> dan aturan
// `html.js .reveal { opacity: 0 }` akan menyembunyikan isi yang tidak pernah
// di-reveal. Skrip ini hanya menyentuh daftar isi, jadi ia aman di halaman yang
// tidak punya animasi masuk.
//
// Tanpa JavaScript daftar isinya tetap berfungsi: tautannya tetap melompat ke
// bagian yang benar, hanya penanda "sedang dibaca" yang tidak muncul.
(() => {
  const pairs = [...document.querySelectorAll('.legal-toc a[href^="#"]')]
    .map((a) => ({ a, t: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
    .filter((p) => p.t);
  if (!pairs.length) return;

  // Sedikit di bawah scroll-padding-top (88px): bagian yang baru masuk sudah
  // dihitung aktif sebelum judulnya benar-benar menempel ke header.
  const OFFSET = 120;
  let current = null;

  function update() {
    let active;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) {
      // Di dasar halaman bagian terakhir belum tentu sempat melewati OFFSET,
      // jadi ia ditandai langsung. Tanpa ini penanda berhenti di bagian
      // kedua dari bawah dan tidak pernah menyentuh bagian penutup.
      active = pairs[pairs.length - 1].a;
    } else {
      // Bagian aktif = yang terakhir sudah melewati OFFSET. Daftar isi dan
      // urutan bagian di halaman sama, jadi urutan di sini sudah urutan baca.
      active = pairs[0].a;
      for (const { a, t } of pairs) {
        if (t.getBoundingClientRect().top <= OFFSET) active = a;
      }
    }
    if (active === current) return;
    current = active;
    for (const { a } of pairs) {
      const on = a === active;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  }

  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
})();
