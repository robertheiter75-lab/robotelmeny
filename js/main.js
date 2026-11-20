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

document.getElementById('ev').textContent = new Date().getFullYear();
Promise.all([renderRobots(), renderGallery()]).then(setupReveal);
