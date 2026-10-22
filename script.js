const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=75`;
const PLACES = [
  { n: 'Hill Track National Park', t: 'mountain', p: 120, img: 'photo-1464822759023-fed622ff2c3b', c: 'Hawaii' },
  { n: 'Swiss Alps', t: 'mountain', p: 340, img: 'photo-1506905925346-21bda4d32df4', c: 'Switzerland' },
  { n: 'Starlit Peaks', t: 'mountain', p: 180, img: 'photo-1519681393784-d120267933ba', c: 'Canada' },
  { n: 'Mirror Lake', t: 'mountain', p: 150, img: 'photo-1501785888041-af3ef285b470', c: 'Italy' },
  { n: 'Sunset Shore', t: 'beach', p: 210, img: 'photo-1507525428034-b723cf961d3e', c: 'Maldives' },
  { n: 'Bali Terraces', t: 'beach', p: 190, img: 'photo-1537996194471-e657df975ab4', c: 'Indonesia' },
  { n: 'Paris Nights', t: 'city', p: 290, img: 'photo-1502602898657-3e91760cbb34', c: 'France' },
  { n: 'Venice Canals', t: 'city', p: 260, img: 'photo-1523906834658-6e24ef2386f9', c: 'Italy' }
];
const $ = s => document.querySelector(s);
const cards = $('#cards');

function draw(filter = 'all', text = '') {
  const t = text.trim().toLowerCase();
  const list = PLACES.filter(p => (filter === 'all' || p.t === filter) && (!t || (p.n + p.c).toLowerCase().includes(t)));
  cards.innerHTML = list.length ? list.map(p => `
    <article class="card" tabindex="0" data-name="${p.n}">
      <img src="${U(p.img)}" alt="${p.n}, ${p.c}" loading="lazy">
      <span class="tag">${p.c}</span>
      <div class="in"><h3>${p.n}</h3><div class="row"><span>★ 4.9</span><span class="price">from $${p.p}</span></div></div>
    </article>`).join('') : '<p>No places match yet. Try another search.</p>';
}
draw();

$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
  draw(b.dataset.f, $('#q').value);
});
$('#search').addEventListener('submit', e => {
  e.preventDefault();
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.f === 'all'));
  draw('all', $('#q').value);
  $('#places').scrollIntoView({ behavior: 'smooth' });
});
cards.addEventListener('click', e => { if (e.target.closest('.card')) openBook(e.target.closest('.card').dataset.name); });
cards.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('card')) openBook(e.target.dataset.name); });

/* nav */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('solid', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
$('#burger').addEventListener('click', e => {
  const open = $('#links').classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', open);
});
$('#links').addEventListener('click', () => $('#links').classList.remove('open'));

/* modals */
const show = (id, on) => { $(id).hidden = !on; document.body.style.overflow = on ? 'hidden' : ''; };
$('#openLogin').addEventListener('click', () => show('#login', true));
$('#closeLogin').addEventListener('click', () => show('#login', false));
$('#closeBook').addEventListener('click', () => show('#book', false));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) show('#' + m.id, false); }));
addEventListener('keydown', e => { if (e.key === 'Escape') { show('#login', false); show('#book', false); } });
function openBook(name = 'Hill Track') { $('#bt').textContent = 'Book ' + name; $('#bookOk').hidden = true; show('#book', true); }
$('#bookBtn').addEventListener('click', () => openBook('Hill Track'));
$('#showPw').addEventListener('click', () => { const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password'; });
$('#loginForm').addEventListener('submit', e => { e.preventDefault(); show('#login', false); });
$('#bookForm').addEventListener('submit', e => { e.preventDefault(); $('#bookOk').hidden = false; });
$('#news').addEventListener('submit', e => { e.preventDefault(); $('#newsOk').hidden = false; });

/* hero background: rotate photos; show video if assets/hero.mp4 exists */
(() => {
  const slides = [...document.querySelectorAll('.hero .slide')];
  const v = $('#heroVideo');
  let i = 0;
  const timer = matchMedia('(prefers-reduced-motion: reduce)').matches ? null : setInterval(() => {
    slides[i].classList.remove('on');
    i = (i + 1) % slides.length;
    slides[i].classList.add('on');
  }, 6000);
  v.addEventListener('canplay', () => { v.classList.add('ready'); if (timer) clearInterval(timer); });
  v.addEventListener('error', () => v.remove(), true);
  v.querySelector('source').addEventListener('error', () => v.remove());
})();
