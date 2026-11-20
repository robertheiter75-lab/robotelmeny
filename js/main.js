// A robotok és a galéria a data/*.json fájlokból töltődnek – ezeket az /admin felületen lehet szerkeszteni.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(path + ': ' + res.status);
  return res.json();
}

async function renderRobots() {
  const box = document.getElementById('robot-lista');
  try {
    const { robotok = [] } = await loadJson('data/robotok.json');
    box.innerHTML = robotok.map(r => `
      <article class="robot reveal">
        <img src="${esc(r.kep)}" alt="${esc(r.nev)} robot" loading="lazy">
        <div class="robot-body">
          <h3>${esc(r.nev)}</h3>
          ${r.alcim ? `<p class="robot-sub">${esc(r.alcim)}</p>` : ''}
          <p>${esc(r.leiras)}</p>
          <ul>${(r.jellemzok || []).map(j => `<li>${esc(j)}</li>`).join('')}</ul>
        </div>
      </article>`).join('');
  } catch (e) {
    console.error(e);
  }
}

let photos = [], current = 0;
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap');

function showPhoto(i) {
  current = (i + photos.length) % photos.length;
  lbImg.src = photos[current].kep;
  lbImg.alt = photos[current].felirat || '';
  lbCap.textContent = photos[current].felirat || '';
}
function openLb(i) { showPhoto(i); lb.hidden = false; document.body.style.overflow = 'hidden'; }
function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }

async function renderGallery() {
  const box = document.getElementById('galeria-lista');
  try {
    ({ kepek: photos = [] } = await loadJson('data/galeria.json'));
    box.innerHTML = photos.map((p, i) => `
      <button type="button" data-i="${i}" aria-label="${esc(p.felirat || 'Fotó')} – nagyítás">
        <img src="${esc(p.kep)}" alt="${esc(p.felirat)}" loading="lazy">
      </button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) openLb(+b.dataset.i);
    });
  } catch (e) {
    console.error(e);
  }
}

lb.querySelector('.lb-close').onclick = closeLb;
lb.querySelector('.lb-prev').onclick = () => showPhoto(current - 1);
lb.querySelector('.lb-next').onclick = () => showPhoto(current + 1);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') showPhoto(current - 1);
  if (e.key === 'ArrowRight') showPhoto(current + 1);
});
let touchX = null;
lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

// mobil menü
const menuBtn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
menuBtn.onclick = () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
};
menu.addEventListener('click', e => { if (e.target.tagName === 'A') menu.classList.remove('open'); });

// görgetésre előtűnő elemek
function setupReveal() {
  const els = document.querySelectorAll('.section h2, .card, .steps li, .facts div, .two-col > *, .robot, .warning, .area');
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('show'); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

// ajánlatkérő felugró ablak (Web3Forms: a kérés e-mailben érkezik)
const modal = document.getElementById('ajanlatkeres');
const form = modal.querySelector('form'), formStatus = modal.querySelector('.form-status');
function openQuote(e) {
  if (e) e.preventDefault();
  menu.classList.remove('open');
  modal.hidden = false; document.body.style.overflow = 'hidden';
  form.querySelector('input[name="nev"]').focus();
}
function closeQuote() { modal.hidden = true; document.body.style.overflow = ''; }
document.querySelectorAll('[data-open-quote]').forEach(b => b.addEventListener('click', openQuote));
modal.querySelector('.modal-close').onclick = closeQuote;
modal.addEventListener('click', e => { if (e.target === modal) closeQuote(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeQuote(); });
if (location.hash === '#ajanlatkeres') openQuote();

form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; formStatus.className = 'form-status'; formStatus.textContent = 'Küldés…';
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || res.status);
    form.reset();
    formStatus.className = 'form-status ok';
    formStatus.textContent = 'Köszönjük! Megkaptuk az ajánlatkérést, hamarosan jelentkezünk.';
  } catch (err) {
    formStatus.className = 'form-status err';
    formStatus.textContent = 'Nem sikerült elküldeni. Kérjük, hívj minket: +36 70 942 7918';
  } finally {
    btn.disabled = false;
  }
});

// magasságjelző: a robot feje teteje és talpa az eredeti (6048×4024-es) fotón mérve,
// innen számoljuk át a képernyőn látható, object-fit: cover-rel kivágott képre
const RULER = { headY: 1343, footY: 3568, x: 1678, headX: 2389, footX: 1935 };
const HERO_SOURCES = { 'hero_mobil.jpg': { scale: 900 / 2494, x0: 1232 }, 'hero.jpg': { scale: 2000 / 6048, x0: 0 } };
const heroEl = document.querySelector('.hero'), heroImg = document.querySelector('.hero-img');
const ruler = document.querySelector('.height-ruler');

function placeRuler() {
  if (!heroImg.naturalWidth) return;
  const file = heroImg.currentSrc.split('/').pop();
  const src = HERO_SOURCES[file] || HERO_SOURCES['hero.jpg'];
  const r = heroImg.getBoundingClientRect(), h = heroEl.getBoundingClientRect();
  const nw = heroImg.naturalWidth, nh = heroImg.naturalHeight;
  const sc = Math.max(r.width / nw, r.height / nh);
  const [px, py] = getComputedStyle(heroImg).objectPosition.split(' ').map(v => parseFloat(v) / 100);
  const ox = (r.width - nw * sc) * px, oy = (r.height - nh * sc) * py;
  const map = (x, y) => [r.left - h.left + ox + (x - src.x0) * src.scale * sc, r.top - h.top + oy + y * src.scale * sc];
  const [x, top] = map(RULER.x, RULER.headY), [, bottom] = map(RULER.x, RULER.footY);
  const [headX] = map(RULER.headX, RULER.headY), [footX] = map(RULER.footX, RULER.footY);
  const visible = x > 30 && top > 0;
  ruler.style.cssText = `left:${x}px;top:${top}px;height:${bottom - top}px;display:${visible ? '' : 'none'}`;
  ruler.querySelector('.hr-top').style.width = `${headX - x + 14}px`;
  ruler.querySelector('.hr-bottom').style.width = `${footX - x + 14}px`;
  ruler.classList.add('ready');
}
heroImg.addEventListener('load', placeRuler);
if (heroImg.complete) placeRuler();
new ResizeObserver(placeRuler).observe(heroEl);

document.getElementById('ev').textContent = new Date().getFullYear();
Promise.all([renderRobots(), renderGallery()]).then(setupReveal);
