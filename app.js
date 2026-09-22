document.documentElement.classList.add('js');

const SCREENSHOTS = [
  {
    src: 'images/home.jpg',
    alt: 'Beranda CarBuddy: kartu kendaraan Toyota Avanza dengan odometer 40.450 km, ringkasan pengeluaran bulan ini, dan kewajiban terdekat',
    caption: 'Beranda: status kendaraan, pengeluaran bulan ini, dan kewajiban terdekat.'
  },
  {
    src: 'images/timeline.jpg',
    alt: 'Tab Timeline dengan chip filter dan daftar catatan BBM, odometer, serta pengeluaran per kendaraan',
    caption: 'Timeline: semua catatan terurut, bisa disaring per kategori.'
  },
  {
    src: 'images/insights.jpg',
    alt: 'Tab Insights dengan kartu jarak tempuh, efisiensi BBM 48,3 km/L, total pengeluaran, dan grafik tren',
    caption: 'Insight: jarak, konsumsi, dan pengeluaran per kendaraan, lengkap dengan trennya.'
  },
  {
    src: 'images/reminders.jpg',
    alt: 'Tab Reminders dengan banner Perlu Perhatian untuk pajak dan daftar pengingat berhitungan hari',
    caption: 'Pengingat: pajak, asuransi, dan servis dengan hitungan hari sebelum jatuh tempo.'
  },
  {
    src: 'images/more.jpg',
    alt: 'Menu More berisi grid modul Vehicles, Maintenance, Fuel Logs, Expense List, Vehicle Tax, Insurance, Tires, dan Battery',
    caption: 'Semua modul: kendaraan, perawatan, BBM, pengeluaran, pajak, asuransi, ban, sampai aki.'
  },
  {
    src: 'images/maintenance.jpg',
    alt: 'Tab Perawatan dengan ringkasan biaya Rp3.820.000, 10 perawatan, 4 jadwal, dan daftar servis berikutnya per kendaraan',
    caption: 'Perawatan: biaya, riwayat servis, dan jadwal berikutnya per kendaraan.'
  },
  {
    src: 'images/detail-maintenance.jpg',
    alt: 'Halaman detail servis CarBuddy: tanggal dan bengkel servis, rincian biaya per komponen dengan totalnya, jadwal servis berikutnya, dan aksi catat servis lanjutan',
    caption: 'Detail servis: rincian biaya per komponen, jadwal berikutnya, dan tautan ke servis lanjutan.'
  }
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Galeri: slide dan dot dibangun dari SCREENSHOTS supaya caption dan alt editnya di satu tempat.
// Ujung track diberi klon slide terakhir & pertama supaya next/prev loop mulus (infinite).
const track = document.getElementById('gal-track');
const dotsWrap = document.getElementById('gal-dots');
const captionEl = document.getElementById('gal-caption');
const gal = document.getElementById('gal');
const n = SCREENSHOTS.length;
const trackCfg = [SCREENSHOTS[n - 1]].concat(SCREENSHOTS, [SCREENSHOTS[0]]);
const dots = [];
let active = 0;       // index ASLI (0..n-1) yang tampil di UI
let suppress = false; // true selama animasi programatik: scroll listener tidak menulis UI
let animId = null;

const realFromTrack = (k) => (k <= 0 ? n - 1 : k > n ? 0 : k - 1);
const trackFromReal = (r) => r + 1;

function makeSlide(cfg, k) {
  const fig = document.createElement('figure');
  fig.className = 'gal-slide';
  fig.dataset.real = String(realFromTrack(k));
  fig.innerHTML =
    '<div class="phone"><div class="phone-screen">' +
    '<img src="' + cfg.src + '" alt="' + cfg.alt + '" width="1080" height="2340"' +
    (k === 1 ? '' : ' loading="lazy"') + ' decoding="async">' +
    '<span class="punch" aria-hidden="true"></span></div></div>';
  fig.addEventListener('click', () => goReal(realFromTrack(k)));
  return fig;
}
trackCfg.forEach((cfg, k) => track.appendChild(makeSlide(cfg, k)));

SCREENSHOTS.forEach((s, i) => {
  const dot = document.createElement('button');
  dot.className = 'gal-dot';
  dot.type = 'button';
  dot.setAttribute('aria-label', 'Screenshot ' + (i + 1) + ' dari ' + n + ': ' + s.caption);
  dot.addEventListener('click', () => goReal(i));
  dotsWrap.appendChild(dot);
  dots.push(dot);
});

// update() selalu menerima index ASLI; klon yang mewakili slide itu ikut menyala saat transit.
function update(i) {
  active = i;
  Array.prototype.forEach.call(track.children, (el) => {
    const on = Number(el.dataset.real) === i;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
  dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
  const cap = SCREENSHOTS[i].caption;
  if (captionEl.textContent !== cap) {
    captionEl.textContent = cap;
    if (!reduceMotion) {
      captionEl.classList.remove('swap');
      void captionEl.offsetWidth;
      captionEl.classList.add('swap');
    }
  }
  const num = String(i + 1).padStart(2, '0');
  rollOdo(odoStrips, num);
}

// Pusat slide diukur dalam frame konten scroll track (rect + scrollLeft), bukan offsetLeft
// yang mengacu ke ancestor lain — campur frame membuat nearest() salah pilih saat drag pendek.
function slideCenter(el) {
  const tr = track.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return er.left + er.width / 2 - tr.left + track.scrollLeft;
}

function nearestTrack() {
  const center = track.scrollLeft + track.clientWidth / 2;
  let best = 0, bd = Infinity;
  Array.prototype.forEach.call(track.children, (el, k) => {
    const d = Math.abs(slideCenter(el) - center);
    if (d < bd) { bd = d; best = k; }
  });
  return best;
}

// Animasi manual rAF + easing, bukan scroll-behavior:smooth: snap dimatikan selama terbang agar
// tidak ada koreksi snap di tengah jalan, dan UI hanya di-update sekali di awal (tanpa kedip).
function animateTo(target, opts = {}) {
  cancelAnimationFrame(animId);
  const el = track.children[target];
  const to = Math.max(slideCenter(el) - track.clientWidth / 2, 0);
  const jump = () => {
    track.classList.add('no-snap');
    track.scrollLeft = to;
    track.classList.remove('no-snap');
    if (opts.done) opts.done();
  };
  const from = track.scrollLeft;
  if (opts.instant || reduceMotion || Math.abs(to - from) < 1) { jump(); return; }
  const dur = Math.min(650, Math.max(340, Math.abs(to - from) * 0.45));
  const t0 = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  suppress = true;
  track.classList.add('no-snap');
  const fly = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    track.scrollLeft = from + (to - from) * ease(p);
    if (p < 1) { animId = requestAnimationFrame(fly); return; }
    track.classList.remove('no-snap');
    suppress = false;
    if (opts.done) opts.done();
  };
  animId = requestAnimationFrame(fly);
}

function snapToReal(i, opts) {
  update(i);
  animateTo(trackFromReal(i), opts);
}

// Kalau posisi istirahat di klon (sisa sentuhan/fling), lompat instan ke slide asli padanannya.
function normalizePosition() {
  const k = nearestTrack();
  if (k !== 0 && k !== n + 1) return realFromTrack(k);
  const r = realFromTrack(k);
  track.classList.add('no-snap');
  track.scrollLeft = Math.max(slideCenter(track.children[trackFromReal(r)]) - track.clientWidth / 2, 0);
  track.classList.remove('no-snap');
  return r;
}

function goReal(i) {
  if (suppress) return;
  normalizePosition();
  snapToReal(((i % n) + n) % n);
}

// next/prev: melewati klon di ujung lalu melompat instan ke slide asli — tanpa putus, tanpa gulir balik.
function step(dir) {
  if (suppress) return;
  normalizePosition();
  const next = active + dir;
  if (next < 0) {
    update(n - 1);
    animateTo(0, { done: () => animateTo(trackFromReal(n - 1), { instant: true }) });
  } else if (next > n - 1) {
    update(0);
    animateTo(n + 1, { done: () => animateTo(trackFromReal(0), { instant: true }) });
  } else {
    goReal(next);
  }
}

let rafPending = false;
// Gulir sentuh bisa berhenti tepat di klon ujung (hasil snap momentum). Setelah gerakan benar-benar
// selesai, klon harus dinormalkan ke slide asli padanannya — kalau tidak, swipe berikutnya menabrak
// ujung fisik track dan galeri terasa macet di HP.
let settleTimer = null;
let touchActive = false;
function armSettle() {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    if (suppress || touchActive || dragging) return;
    normalizePosition();
  }, 140);
}
track.addEventListener('scroll', () => {
  armSettle();
  if (suppress || rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (suppress) return;
    const real = realFromTrack(nearestTrack());
    if (real !== active) update(real);
  });
}, { passive: true });

// Sentuhan saat animasi berjalan membatalkannya supaya geser manual tidak berkelahi dengan rAF.
track.addEventListener('touchstart', () => {
  touchActive = true;
  clearTimeout(settleTimer);
  if (suppress) {
    cancelAnimationFrame(animId);
    suppress = false;
    track.classList.remove('no-snap');
  }
}, { passive: true });
const touchDone = () => { touchActive = false; armSettle(); };
track.addEventListener('touchend', touchDone, { passive: true });
track.addEventListener('touchcancel', touchDone, { passive: true });

document.getElementById('gal-prev').addEventListener('click', () => step(-1));
document.getElementById('gal-next').addEventListener('click', () => step(1));

gal.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
});

// Drag mouse di desktop; sentuh memakai scroll-snap native, dan istirahat di klon dirapikan armSettle.
let dragging = false, dragStartX = 0, dragStartLeft = 0;
track.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  dragging = true;
  dragStartX = e.clientX;
  dragStartLeft = track.scrollLeft;
  track.classList.add('dragging');
  track.setPointerCapture(e.pointerId);
});
track.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  track.scrollLeft = dragStartLeft - (e.clientX - dragStartX);
});
function endDrag() {
  if (!dragging) return;
  dragging = false;
  const k = nearestTrack();
  // Lepas 'dragging' sambil langsung pasang 'no-snap': snap mandatory tidak boleh mengoreksi
  // posisi sebelum animasi selembarkan berjalan, kalau tidak lompatannya terlihat.
  track.classList.remove('dragging');
  track.classList.add('no-snap');
  // Lepas di zona klon: selembarkan dulu klon ke tengah, baru lompat instan ke slide asli —
  // lompatan langsung dari posisi sembarangan akan terlihat karena klon belum persis di tengah.
  if (k === 0) {
    update(n - 1);
    animateTo(0, { done: () => animateTo(trackFromReal(n - 1), { instant: true }) });
  } else if (k === n + 1) {
    update(0);
    animateTo(n + 1, { done: () => animateTo(trackFromReal(0), { instant: true }) });
  } else {
    goReal(realFromTrack(k));
  }
}
track.addEventListener('pointerup', endDrag);
track.addEventListener('pointercancel', endDrag);

// Isi tiap sel odometer dengan strip vertikal 0-9 di balik jendela setinggi satu angka:
// pemakainya cukup menggeser strip dan CSS yang menggulirkannya. Angka statis di HTML tetap
// jadi tampilan fallback sebelum JS jalan. Satu builder untuk semua instance (galeri + wizard).
function buildOdoStrips(cells) {
  return [...cells].map((cell) => {
    const win = document.createElement('span');
    win.className = 'odo-win';
    const strip = document.createElement('span');
    strip.className = 'odo-strip';
    for (let d = 0; d <= 9; d++) {
      const digit = document.createElement('span');
      digit.textContent = String(d);
      strip.appendChild(digit);
    }
    win.appendChild(strip);
    cell.textContent = '';
    cell.appendChild(win);
    return strip;
  });
}
function rollOdo(strips, num) {
  strips.forEach((strip, k) => { strip.style.transform = 'translateY(' + (-Number(num[k])) + 'em)'; });
}
const odoStrips = buildOdoStrips(document.querySelectorAll('.gal-counter [data-odo]'));
const wizStrips = buildOdoStrips(document.querySelectorAll('.wiz-counter [data-odo]'));

// Posisi awal: slide asli pertama di tengah (child 0 adalah klon slide terakhir).
update(0);
track.scrollLeft = Math.max(slideCenter(track.children[1]) - track.clientWidth / 2, 0);

// Wizard cara mulai: satu langkah tampil pada satu waktu; pindah langkah mem-fade panel dan
// screenshot sambil odometer menggulir nomornya. Di langkah terakhir, Lanjut diganti CTA unduh
// supaya wizard bermuara ke satu tindakan, bukan berhenti di ujung mati.
const wizRoot = document.getElementById('wiz');
const wizPrev = document.getElementById('wiz-prev');
const wizNext = document.getElementById('wiz-next');
const wizCta = document.getElementById('wiz-cta');
const wizPanels = [...document.querySelectorAll('.wiz-panel')];
const wizShots = [...document.querySelectorAll('.wiz-shot')];
const wizSlider = document.getElementById('wiz-slider');
const wizSlides = [...document.querySelectorAll('.wiz-slide')];
const wizDots = document.getElementById('wiz-dots');
const wizDotBtns = [...document.querySelectorAll('.wiz-dot')];
let wizI = 0;
function wizUpdate() {
  wizPanels.forEach((p, k) => p.classList.toggle('is-on', k === wizI));
  wizShots.forEach((s, k) => {
    s.classList.toggle('is-on', k === wizI);
    s.setAttribute('aria-hidden', k === wizI ? 'false' : 'true');
  });
  // Titik penanda hanya relevan selama langkah dua tampil, dan slidernya cuma boleh di-tab
  // saat benar-benar tampil.
  wizDots.hidden = wizI !== 1;
  wizSlider.tabIndex = wizI === 1 ? 0 : -1;
  rollOdo(wizStrips, String(wizI + 1).padStart(2, '0'));
  wizPrev.hidden = wizI === 0;
  const last = wizI === wizPanels.length - 1;
  wizNext.hidden = last;
  wizCta.hidden = !last;
}
function wizGo(next) {
  const to = Math.max(0, Math.min(wizPanels.length - 1, next));
  if (to !== wizI) { wizI = to; wizUpdate(); }
}
wizPrev.addEventListener('click', () => wizGo(wizI - 1));
wizNext.addEventListener('click', () => wizGo(wizI + 1));

// Slider langkah dua: tiga langkah formulir digeser mendatar, titik penanda mengikuti posisi.
// Indeks dihitung dari geometri slide, bukan scrollLeft/clientWidth, karena track memakai padding
// pengintip: tetangga di tepi harus terlihat supaya jelas masih ada gambar lain.
function wizSlideCenter(el) {
  const tr = wizSlider.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return er.left + er.width / 2 - tr.left + wizSlider.scrollLeft;
}
function wizSlideIndex() {
  const center = wizSlider.scrollLeft + wizSlider.clientWidth / 2;
  let best = 0, bd = Infinity;
  wizSlides.forEach((el, k) => {
    const d = Math.abs(wizSlideCenter(el) - center);
    if (d < bd) { bd = d; best = k; }
  });
  return best;
}
function wizSlideTo(k) {
  const to = Math.max(0, Math.min(wizSlides.length - 1, k));
  const el = wizSlides[to];
  wizSlider.scrollTo({
    left: Math.max(wizSlideCenter(el) - wizSlider.clientWidth / 2, 0),
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
}
function wizSlideUpdate() {
  const k = wizSlideIndex();
  wizSlides.forEach((s, i) => s.classList.toggle('is-active', i === k));
  wizDotBtns.forEach((d, i) => d.setAttribute('aria-current', String(i === k)));
}
wizSlider.addEventListener('scroll', wizSlideUpdate, { passive: true });
wizDotBtns.forEach((d, k) => d.addEventListener('click', () => wizSlideTo(k)));

// Drag mouse di desktop; di layar sentuh scroll-snap native sudah cukup.
let wizDragging = false, wizDragX = 0, wizDragLeft = 0;
wizSlider.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  wizDragging = true;
  wizDragX = e.clientX;
  wizDragLeft = wizSlider.scrollLeft;
  wizSlider.classList.add('dragging');
  wizSlider.setPointerCapture(e.pointerId);
});
wizSlider.addEventListener('pointermove', (e) => {
  if (!wizDragging) return;
  wizSlider.scrollLeft = wizDragLeft - (e.clientX - wizDragX);
});
function wizEndDrag() {
  if (!wizDragging) return;
  wizDragging = false;
  wizSlider.classList.remove('dragging');
  wizSlideTo(wizSlideIndex());
}
wizSlider.addEventListener('pointerup', wizEndDrag);
wizSlider.addEventListener('pointercancel', wizEndDrag);
wizSlider.addEventListener('keydown', (e) => {
  // Panah ditahan di slider selama fokus ada di sini, kalau tidak #wiz ikut melompatkan langkah.
  if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); wizSlideTo(wizSlideIndex() - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); wizSlideTo(wizSlideIndex() + 1); }
});
wizRoot.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); wizGo(wizI - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); wizGo(wizI + 1); }
});
wizUpdate();
wizSlideUpdate();

// Accordion FAQ
document.querySelectorAll('.faq-q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.closest('.faq-item').classList.toggle('open', !open);
  });
});

// Menu mobile
const head = document.getElementById('site-head');
const burger = document.getElementById('burger');
const menu = document.getElementById('mobile-menu');
function setMenu(open) {
  head.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  burger.querySelector('.ms').textContent = open ? 'close' : 'menu';
  if (open) { menu.querySelector('a').focus(); } else { burger.focus(); }
}
burger.addEventListener('click', () => setMenu(!head.classList.contains('menu-open')));
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && head.classList.contains('menu-open')) setMenu(false);
});

// Scrollspy nav
const spyLinks = [...document.querySelectorAll('[data-spy]')];
const spyMap = new Map(spyLinks.map((l) => [l.getAttribute('href').slice(1), l]));
const spyIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    spyLinks.forEach((l) => l.classList.remove('active'));
    const link = spyMap.get(en.target.id);
    if (link) link.classList.add('active');
  });
}, { rootMargin: '-30% 0px -60% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => spyIO.observe(s));

// Reveal sekali jalan
if ('IntersectionObserver' in window && !reduceMotion) {
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      revIO.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => revIO.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

// Overlay onboarding: replika langkah pertama onboarding aplikasi. Tampil di setiap muat halaman;
// tombol Mulai atau Escape menutupnya dengan slide ke atas dan membeaskan landing.
//
// Pengecualian: pengunjung yang datang dari halaman legal (privasi atau ketentuan)
// tidak melihatnya. Mereka sudah pernah membuka halaman ini, dan yang mereka cari
// adalah bagian yang mereka tuju, bukan sambutan sekali jalan. Referrer dipakai
// supaya semua tautan balik dari halaman itu ikut tercegah tanpa perlu menandai
// satu per satu: tombol "kembali ke beranda", logo merek, tombol Early Access,
// dan tautan footer.
const cameFromLegal = (() => {
  try {
    if (!document.referrer) return false;
    const from = new URL(document.referrer);
    if (from.origin !== location.origin) return false;
    // Nama berkasnya saja: GitHub Pages menyajikan /privasi tanpa ekstensi,
    // server lokal menyajikannya sebagai privacy.html.
    const page = from.pathname.split('/').filter(Boolean).pop() || '';
    return ['privacy', 'privacy.html', 'terms', 'terms.html'].includes(page);
  } catch {
    return false;
  }
})();

const ob = document.getElementById('ob');
const obLogo = document.getElementById('ob-logo');
const obStart = document.getElementById('ob-start');
let obPrevFocus = null;
function obOpen() {
  obPrevFocus = document.activeElement;
  ob.hidden = false;
  document.body.classList.add('ob-lock');
  obStart.focus();
}
function obClose() {
  document.body.classList.remove('ob-lock');
  const finish = () => {
    ob.hidden = true;
    ob.classList.remove('ob-out');
    if (obPrevFocus instanceof HTMLElement && obPrevFocus !== document.body) obPrevFocus.focus();
    else document.querySelector('.brand').focus();
  };
  if (reduceMotion) finish();
  else { ob.classList.add('ob-out'); setTimeout(finish, 470); }
}
if (ob && obLogo && obStart && !cameFromLegal) {
  obOpen();
  obLogo.addEventListener('click', () => {
    obLogo.classList.remove('rev');
    void obLogo.offsetWidth;
    obLogo.classList.add('rev');
  });
  obStart.addEventListener('click', obClose);
  ob.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); obClose(); return; }
    if (e.key !== 'Tab') return;
    const ring = [obLogo, obStart];
    const i = ring.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); ring[1].focus(); }
    else if (!e.shiftKey && i === ring.length - 1) { e.preventDefault(); ring[0].focus(); }
  });
}

/* ===== Pendaftaran uji coba tertutup (#beta) =====
   Tidak ada backend: formulir ini menyusun pesan lalu menyerahkannya ke WhatsApp
   atau email, dan pendaftar sendiri yang menekan kirim. WhatsApp hanya
   MEMPRACARAKAN pesan, tidak pernah mengirim otomatis, jadi tombolnya diberi
   label "Daftar lewat WhatsApp" supaya jelas ada satu langkah lagi di sana. */
(() => {
  const form = document.getElementById('beta-form');
  if (!form) return;

  const emailEl = document.getElementById('beta-email');
  const deviceEl = document.getElementById('beta-device');
  const ackEl = document.getElementById('beta-ack');
  const errorEl = document.getElementById('beta-error');
  const mailLink = document.getElementById('beta-mail');

  // Nomor WhatsApp pengembang. Digit saja: tanda + di depan wa.me merusak link.
  const WA_NUMBER = '6285811974427';
  const CONTACT_EMAIL = 'dev@azmirf.my.id';

  function composeMessage() {
    const email = emailEl.value.trim();
    const device = deviceEl.value.trim();
    const lines = [
      'Halo, saya mau ikut uji coba tertutup CarBuddy.',
      '',
      'Email Google Play: ' + email,
    ];
    if (device) lines.push('Tipe HP: ' + device);
    lines.push('', 'Saya sudah paham harus tetap terdaftar dan aktif memakai aplikasinya selama masa uji.');
    return lines.join('\n');
  }

  function refreshFallback() {
    const subject = 'Pendaftaran uji coba tertutup CarBuddy';
    mailLink.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(composeMessage());
  }

  function validate() {
    const email = emailEl.value.trim();
    // Cek longgar dengan sengaja: validasi ketat milik browser menolak alamat
    // yang sebenarnya sah, dan tujuannya hanya menangkap kolom yang kosong.
    const ok = email.includes('@') && email.includes('.') && ackEl.checked;
    errorEl.classList.toggle('show', !ok);
    return ok;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      (emailEl.value.trim() === '' ? emailEl : ackEl).focus();
      return;
    }
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(composeMessage()), '_blank', 'noopener');
  });

  // Link email memakai pesan yang sama, jadi pendaftaran lewat jalur cadangan
  // tetap membawa kolom yang sama. Di-refresh saat diketik juga, bukan hanya
  // saat diklik: dengan begitu href-nya selalu benar tanpa bergantung pada
  // urutan handler sebelum aksi bawaan browser.
  mailLink.addEventListener('click', refreshFallback);

  // Kolom yang diisi menghapus peringatan, supaya pesan error tidak tertinggal
  // setelah masalahnya diperbaiki.
  [emailEl, ackEl].forEach((el) => el.addEventListener('input', () => {
    if (errorEl.classList.contains('show')) validate();
  }));
  [emailEl, deviceEl].forEach((el) => el.addEventListener('input', refreshFallback));

  refreshFallback();
})();
