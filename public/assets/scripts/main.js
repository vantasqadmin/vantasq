function openMob()  { document.getElementById('mobileNav').classList.add('open'); document.body.style.overflow='hidden'; }
function closeMob() { document.getElementById('mobileNav').classList.remove('open'); document.body.style.overflow=''; }

/* The old handler showed "✓ Message Sent!" and posted nothing anywhere. Leave
   FORM_ENDPOINT empty and the form composes a real email in the visitor's own
   mail client; set it to a FormSubmit / Formspree / serverless URL and the same
   form posts there instead (add that origin to connect-src in _headers). */
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = 'info@vantasq.com';

function formSay(status, message, isError) {
if (!status) return;
status.textContent = message;
status.classList.toggle('is-error', !!isError);
}

function composeBody(d) {
return [
    'Name: ' + (d.firstName || '') + ' ' + (d.lastName || ''),
    'Email: ' + (d.email || ''),
    'Phone: ' + (d.phone || 'not given'),
    'Service: ' + (d.service || ''),
    '',
    d.message || ''
].join('\n');
}

function handleForm(e) {
e.preventDefault();
const form = e.target;
const status = form.querySelector('.form-status');
const btn = form.querySelector('button[type="submit"]');

if (!form.checkValidity()) {
    form.reportValidity();
    formSay(status, '');
    return;
}

const data = {};
new FormData(form).forEach((v, k) => { data[k] = v; });

if (!FORM_ENDPOINT) {
    window.location.href = 'mailto:' + CONTACT_EMAIL +
    '?subject=' + encodeURIComponent('Project enquiry: ' + (data.service || 'general')) +
    '&body=' + encodeURIComponent(composeBody(data));
    formSay(status, 'Opening your email app. If nothing happens, write to ' + CONTACT_EMAIL + ' directly.');
    return;
}

btn.disabled = true;
formSay(status, 'Sending…');
fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
    .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    form.reset();
    formSay(status, 'Thanks. We will reply within one business day.');
    })
    .catch(() => formSay(status, 'That did not go through. Please email ' + CONTACT_EMAIL + ' instead.', true))
    .then(() => { btn.disabled = false; });
}

/* Scroll reveal. Blocks fly up as they arrive, staggered within their own
   row so a grid arrives as a sequence rather than all at once. Classes do
   the work; JS only decides when, and only the first time. */
(function () {
  const SELECTOR = [
    '.svc-item', '.steps li', '.sys', '.work', '.pf-gallery figure', '.pf-cap',
    '.c-item', '.legal-section', '.pf-head', '.side-card', '.related',
  ].join(', ');

  const blocks = document.querySelectorAll(SELECTOR);
  if (!blocks.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.classList.remove('is-waiting');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  blocks.forEach((el, i) => {
    const row = el.parentElement ? [...el.parentElement.children].indexOf(el) : i;
    el.style.setProperty('--reveal-delay', Math.min(row % 6, 5) * 70 + 'ms');
    el.classList.add('reveal', 'is-waiting');
    io.observe(el);
  });

  // Whatever is already on screen at load skips the wait entirely, and
  // anything the observer never reports still ends up visible quickly.
  requestAnimationFrame(function () {
    blocks.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.remove('is-waiting');
    });
  });
  setTimeout(function () {
    blocks.forEach((el) => el.classList.remove('is-waiting'));
  }, 1200);
})();
/* ─── 2026 motion system ─────────────────────────────────────────
   One scroll handler, one rAF per frame: the header fill, the progress
   rail, the hero drifting out, and the pinned process row. Reveals are
   an IntersectionObserver adding is-in. Under reduced motion only the
   header state runs. */
(function () {
  const ASSET_V = '20261029b';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;

  // Reveals. html.js is what lets CSS hide anything, so it is set only when
  // something will show it again.
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length && canObserve && !reduce) {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => {
      const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal')) : [];
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  const nav = document.querySelector('nav.nav-over');
  const rail = document.querySelector('.prog i');
  const heroCopy = document.querySelector('[data-hero-copy]');
  const pin = document.querySelector('[data-pin]');
  const track = pin && pin.querySelector('[data-pin-track]');
  const pinRail = pin && pin.querySelector('[data-pin-rail]');
  let travel = 0;

  function measure() {
    if (!pin || !track || reduce) return;
    pin.classList.add('is-pinned');
    travel = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    pin.style.height = (window.innerHeight + travel) + 'px';
  }

  function update() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (nav) nav.classList.toggle('is-scrolled', y > 24);
    if (reduce) return;
    if (rail) {
      const max = document.documentElement.scrollHeight - vh;
      rail.style.transform = 'scaleY(' + (max > 0 ? y / max : 0) + ')';
    }
    if (heroCopy && y < vh * 1.2) {
      const p = Math.min(1, y / (vh * 0.85));
      heroCopy.style.transform = 'translate3d(0,' + (-p * 120) + 'px,0)';
      heroCopy.style.opacity = String(1 - p);
    }
    if (pin && travel) {
      const r = pin.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / travel));
      track.style.transform = 'translate3d(' + (-p * travel) + 'px,0,0)';
      if (pinRail) pinRail.style.transform = 'scaleX(' + p + ')';
    }
  }

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }

  measure();
  update();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => { measure(); queue(); });
  window.addEventListener('load', () => { measure(); queue(); });

  // Testimonials: one quote at a time, advancing every 7s until someone
  // picks one, and holding while the pointer or focus is inside.
  const quotes = document.querySelector('[data-quotes]');
  if (quotes) {
    const figs = [...quotes.querySelectorAll('.q')];
    const picks = [...quotes.querySelectorAll('.qpick')];
    let at = 0, timer = 0, held = false, chosen = reduce;
    const show = (i) => {
      at = i;
      figs.forEach((f, n) => f.classList.toggle('is-on', n === i));
      picks.forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    };
    const loop = () => {
      clearTimeout(timer);
      if (chosen || held) return;
      timer = setTimeout(() => { show((at + 1) % figs.length); loop(); }, 7000);
    };
    picks.forEach((b, i) => b.addEventListener('click', () => { chosen = true; clearTimeout(timer); show(i); }));
    const hold = (on) => { held = on; quotes.classList.toggle('is-paused', on); loop(); };
    quotes.addEventListener('mouseenter', () => hold(true));
    quotes.addEventListener('mouseleave', () => hold(false));
    quotes.addEventListener('focusin', () => hold(true));
    quotes.addEventListener('focusout', () => hold(false));
    loop();
  }

  // The WebGL globe costs a 130 KB library and a render loop on the main
  // thread, so it waits for the visitor's first scroll, pointer move or key
  // press after load, and is skipped on phone-width screens (where it sits at
  // half opacity behind the copy) and on save-data. The SVG poster, the
  // globe's first frame, stands in until then and wherever it never starts.
  const globes = document.querySelectorAll('[data-globe]');
  const conn = navigator.connection;
  const phone = window.matchMedia('(max-width: 860px)').matches;
  if (globes.length && !phone && !(conn && conn.saveData)) {
    const start = () => {
      import('./hero-globe.js?v=' + ASSET_V).then((m) => {
        globes.forEach((g) => m.mountGlobe(g.querySelector('canvas'), {
          labels: g.querySelector('.globe-labels'),
          scroll: g.dataset.globe === 'hero',
        }));
      }).catch(() => {});
    };
    const idle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 200));
    const events = ['pointermove', 'pointerdown', 'scroll', 'wheel', 'keydown', 'touchstart'];
    const onFirst = () => {
      events.forEach((t) => window.removeEventListener(t, onFirst));
      idle();
    };
    const arm = () => events.forEach((t) => window.addEventListener(t, onFirst, { passive: true }));
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm);
  }
})();

/* Contents rail: the link for the section being read is marked current. */
(function () {
  const links = [...document.querySelectorAll('.toc > ul a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map();
  links.forEach((a) => {
    const t = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (t) byId.set(t, a);
  });
  const seen = new Set();
  const mark = () => {
    let current = null;
    byId.forEach((a, t) => { if (seen.has(t) && (!current || t.offsetTop < current.offsetTop)) current = t; });
    links.forEach((a) => a.removeAttribute('aria-current'));
    if (current) byId.get(current).setAttribute('aria-current', 'true');
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
    mark();
  }, { rootMargin: '-96px 0px -55% 0px' });
  byId.forEach((a, t) => io.observe(t));
})();

/* A sidebar taller than the window sticks by its bottom edge instead, so its
   last card is still reachable while it rides along. */
(function () {
  const toc = document.querySelector('.toc');
  if (!toc) return;
  const fit = () => {
    const room = window.innerHeight - 104 - 24;
    toc.style.top = toc.offsetHeight > room ? (window.innerHeight - toc.offsetHeight - 24) + 'px' : '';
  };
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
})();

/* Portfolio creative wall: each post opens in a lightbox with previous/next,
   arrow keys and swipe. The buttons are added here, so without JS the grid
   stays a plain set of images. */
(function () {
  const figures = [...document.querySelectorAll('.pf-gallery figure')];
  if (!figures.length || typeof HTMLDialogElement !== 'function') return;

  const items = figures.map((fig) => {
    const img = fig.querySelector('img');
    const caption = fig.querySelector('figcaption');
    return { src: img.currentSrc || img.src, alt: img.alt, caption: caption ? caption.textContent : '', img };
  });

  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Campaign creative viewer');
  box.innerHTML =
    '<figure class="lb-stage"><img class="lb-img" alt="" /><figcaption><span class="lb-caption"></span><span class="lb-count"></span></figcaption></figure>' +
    '<button type="button" class="lb-btn lb-close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="Previous image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="Next image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>';
  document.body.appendChild(box);

  const view = box.querySelector('.lb-img');
  const cap = box.querySelector('.lb-caption');
  const count = box.querySelector('.lb-count');
  let index = 0;

  const show = (i, dir) => {
    index = (i + items.length) % items.length;
    const it = items[index];
    view.src = it.src;
    view.alt = it.alt;
    cap.textContent = it.caption;
    count.textContent = (index + 1) + ' / ' + items.length;
    view.classList.remove('lb-from-left', 'lb-from-right');
    if (dir) { void view.offsetWidth; view.classList.add(dir > 0 ? 'lb-from-right' : 'lb-from-left'); }
    [index - 1, index + 1].forEach((n) => { new Image().src = items[(n + items.length) % items.length].src; });
  };

  let opener = null;
  figures.forEach((fig, i) => {
    const img = items[i].img;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pf-zoom';
    btn.setAttribute('aria-label', 'View larger: ' + items[i].caption);
    img.replaceWith(btn);
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      opener = btn;
      show(i);
      box.showModal();
      document.documentElement.classList.add('lb-open');
    });
  });

  box.addEventListener('close', () => {
    document.documentElement.classList.remove('lb-open');
    if (opener) opener.focus();
  });
  box.querySelector('.lb-close').addEventListener('click', () => box.close());
  box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1, -1));
  box.querySelector('.lb-next').addEventListener('click', () => show(index + 1, 1));
  // A click on the dim backdrop (the dialog itself, outside the stage) closes it.
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 1); }
  });

  let startX = null, startY = 0;
  box.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { startX = e.clientX; startY = e.clientY; } });
  box.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  box.addEventListener('pointercancel', () => { startX = null; });
})();
