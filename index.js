// -- LOADER --
const loaderEl = document.getElementById('loader');
function hideLoader() {
  if (!loaderEl) return;
  loaderEl.classList.add('gone');
  document.body.classList.add('hero-ready');
  document.body.classList.add('loaded');
  // Keep vertical scrolling enabled even if any future style changes attempt to lock it.
  document.body.style.overflowY = 'auto';
}
window.addEventListener('load', () => setTimeout(hideLoader, 220));
// Fallback: never let loader block interaction for too long.
window.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 900));
window.addEventListener('pageshow', hideLoader);

// ── Anchor-hash re-scroll fix ───────────────────────────────────────────────
// content-visibility:auto collapses off-screen sections during initial load,
// so the browser's native hash scroll overshoots (e.g. #dept-contacts → lands
// at #enquiryForm). We fire two corrective scrolls after layout stabilises.
function scrollToHash(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  const NAV_HEIGHT = 85;
  const top = target.getBoundingClientRect().top + window.pageYOffset - NAV_HEIGHT;
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
}

function fixHashScroll() {
  const hash = window.location.hash;
  if (!hash) return;
  // First attempt: after load + 2 animation frames (layout settled)
  requestAnimationFrame(() => requestAnimationFrame(() => scrollToHash(hash)));
  // Second attempt: after 500ms (handles slow content-visibility expansion)
  setTimeout(() => scrollToHash(hash), 500);
}
window.addEventListener('load', fixHashScroll);

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const saveDataMode = Boolean(conn && (conn.saveData || /2g/.test(conn.effectiveType || '')));

function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initHeroVideoPlayback() {
  const heroVideo = document.querySelector('.hero-bg-video');
  if (!heroVideo) return;

  if (reduceMotionQuery.matches || saveDataMode) {
    heroVideo.pause();
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        heroVideo.play().catch(() => { });
        // Fade in when ready
        heroVideo.addEventListener('canplaythrough', () => {
          heroVideo.classList.add('ready');
        }, { once: true });
        // Fallback if event doesn't fire
        setTimeout(() => heroVideo.classList.add('ready'), 2000);
      } else {
        heroVideo.pause();
      }
    });
  }, { threshold: 0.2 });

  obs.observe(heroVideo);
}

initHeroVideoPlayback();

// -- HERO CARD INTERACTION --
const heroCardEl = document.querySelector('.hero-card.hero-tilt');
if (heroCardEl && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  heroCardEl.addEventListener('pointermove', (event) => {
    const rect = heroCardEl.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rx = (0.5 - y) * 2.6;
    const ry = (x - 0.5) * 3.6;
    heroCardEl.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    heroCardEl.style.setProperty('--hero-card-x', `${(x * 100).toFixed(2)}%`);
    heroCardEl.style.setProperty('--hero-card-y', `${(y * 100).toFixed(2)}%`);
  });

  heroCardEl.addEventListener('pointerleave', () => {
    heroCardEl.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg)';
  });
}

function animateHeroCounters() {
  const counters = Array.from(document.querySelectorAll('.hs-num[data-hero-target]'));
  if (!counters.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = () => {
    counters.forEach(counter => {
      const target = Number(counter.dataset.heroTarget || 0);
      const valueEl = counter.querySelector('.hs-val');
      if (!valueEl || !Number.isFinite(target)) return;
      if (reduceMotion) {
        valueEl.textContent = String(target);
        return;
      }

      const duration = 1200;
      const start = performance.now();
      const from = 0;
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(from + (target - from) * eased);
        valueEl.textContent = String(val);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const hero = document.getElementById('hero');
  if (!hero) {
    run();
    return;
  }

  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    run();
    io.disconnect();
  }, { threshold: 0.4 });

  io.observe(hero);
}

animateHeroCounters();

// -- LIVE COCONUT COUNTERS --
(function initLiveCounters() {
  const totalEl = document.getElementById('liveTotalCount');
  if (!totalEl) return;

  const DAILY_TARGET = 15000; // 15,000 coconuts broken per day (static display in hero)
  const BASE_TOTAL = 25000000; // 2.5 Crore — existing historical total
  const START_DATE = new Date(2026, 3, 25); // April 25, 2026 (month is 0-indexed)

  function daysSinceStart() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = today - START_DATE;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  function formatIndian(n) {
    n = Math.floor(n);
    const s = n.toString();
    if (s.length <= 3) return s;
    let last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return rest + ',' + last3;
  }

  function updateTotalCounter() {
    const now = new Date();
    const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const startSeconds = 6 * 3600; // 6 AM
    const endSeconds = 23 * 3600;  // 11 PM

    let dailyCount = 0;
    if (currentTimeInSeconds >= endSeconds) {
      dailyCount = DAILY_TARGET;
    } else if (currentTimeInSeconds >= startSeconds) {
      const activeSeconds = currentTimeInSeconds - startSeconds;
      const totalActiveDuration = endSeconds - startSeconds;
      dailyCount = Math.floor((activeSeconds / totalActiveDuration) * DAILY_TARGET);
    } else {
      dailyCount = 0;
    }

    const completedDays = daysSinceStart();
    const currentTotal = BASE_TOTAL + (completedDays * DAILY_TARGET) + dailyCount;

    totalEl.textContent = formatIndian(currentTotal);
  }

  let counterTimer = null;
  function startCounterLoop() {
    const intervalMs = document.hidden ? 5000 : 1000;
    if (counterTimer) clearInterval(counterTimer);
    counterTimer = setInterval(updateTotalCounter, intervalMs);
  }

  updateTotalCounter();
  startCounterLoop();
  document.addEventListener('visibilitychange', startCounterLoop);
})();

// -- NAV --
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });
function toggleNav() {
  const navLinks = document.getElementById('navLinks');
  const isOpen = navLinks.classList.toggle('open');
  document.getElementById('hbg').classList.toggle('active', isOpen);
  if (!isOpen) document.querySelectorAll('.has-submenu').forEach(li => li.classList.remove('open'));
}

function isMobileNav() {
  return window.matchMedia('(max-width: 1080px)').matches;
}

document.querySelectorAll('.has-submenu > a').forEach(a => {
  a.addEventListener('click', e => {
    if (!isMobileNav()) return;
    e.preventDefault();
    a.parentElement.classList.toggle('open');
  });
});

// Improved Nav & Anchor Scroll
document.addEventListener('click', e => {
  const target = e.target.closest('a');
  if (!target) return;

  const href = target.getAttribute('href');
  
  // Close menu if clicking any link on mobile (except submenus)
  if (isMobileNav() && !target.closest('.has-submenu')) {
    const navLinks = document.getElementById('navLinks');
    const hbg = document.getElementById('hbg');
    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      if (hbg) hbg.classList.remove('active');
    }
  }

  // Smooth scroll for internal anchors
  if (href && href.startsWith('#') && href.length > 1) {
    const el = document.querySelector(href);
    if (el) {
      e.preventDefault();
      const offset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }
});

function applyProductImagesFromConfig() {
  const imageMap = window.PRODUCT_IMAGE_MAP || {};
  document.querySelectorAll('.pc-link[data-product-key]').forEach(link => {
    const key = link.getAttribute('data-product-key');
    const image = imageMap[key];
    const imgEl = link.querySelector('.pc-img img');
    if (!image || !imgEl) return;
    imgEl.src = image.src;
    imgEl.alt = image.alt || imgEl.alt;
    imgEl.style.objectFit = image.fit || 'cover';
    imgEl.style.objectPosition = image.position || 'center center';
  });
}

applyProductImagesFromConfig();

function initInteractiveProductCards() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !canHover) return;

  document.querySelectorAll('.pc').forEach(card => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;
      const rx = (0.5 - py) * 7;
      const ry = (px - 0.5) * 9;

      card.style.setProperty('--pc-rx', `${rx.toFixed(2)}deg`);
      card.style.setProperty('--pc-ry', `${ry.toFixed(2)}deg`);
      card.style.setProperty('--pc-gx', `${(px * 100).toFixed(2)}%`);
      card.style.setProperty('--pc-gy', `${(py * 100).toFixed(2)}%`);
      card.style.setProperty('--pc-glare', '1');
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--pc-rx', '0deg');
      card.style.setProperty('--pc-ry', '0deg');
      card.style.setProperty('--pc-gx', '50%');
      card.style.setProperty('--pc-gy', '50%');
      card.style.setProperty('--pc-glare', '0');
    });
  });
}

initInteractiveProductCards();

// -- SCROLL REVEAL (IntersectionObserver -- no JS on scroll) --
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); ro.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.rv,.rvl,.rvr').forEach(el => ro.observe(el));

// -- COUNTER ANIMATION --
const co = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '+';
    const decimal = parseInt(el.dataset.decimal) || 0;

    let v = 0;
    const duration = 2000; // 2 seconds
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      const current = v + (target - v) * eased;
      el.textContent = current.toFixed(decimal) + suffix;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    co.unobserve(el);
  });
}, { threshold: 0.2 });
document.querySelectorAll('[data-target]').forEach(el => co.observe(el));



// -- FORM (FormSubmit.co via AJAX) --
const enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const formBox = document.getElementById('formContent');
    const successBox = document.getElementById('fSuccess');
    const formData = new FormData(enquiryForm);

    fetch(enquiryForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
      .then(response => {
        if (response.ok) {
          formBox.style.display = 'none';
          successBox.style.display = 'block';
          enquiryForm.reset();

          setTimeout(() => {
            successBox.style.display = 'none';
            formBox.style.display = 'block';
          }, 4000);
        } else {
          alert('Something went wrong. Please try again.');
        }
      })
      .catch(() => {
        alert('Network error. Please check your connection and try again.');
      });
  });
}

// -- NEWSLETTER (FormSubmit.co via AJAX) --
const nlForm = document.getElementById('newsletterForm');
if (nlForm) {
  nlForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const nlRow = document.getElementById('nlRow');
    const nlSuccess = document.getElementById('nlSuccess');
    const formData = new FormData(nlForm);

    fetch(nlForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
      .then(response => {
        if (response.ok) {
          nlRow.style.display = 'none';
          nlSuccess.style.display = 'block';
          nlForm.reset();
        }
      })
      .catch(() => { });
  });
}
// -- ABOUT VIDEO PERSISTENCE --
const aboutVid = document.querySelector('.a-main-video');
if (aboutVid) {
  // Play only when visible to avoid below-fold video load on startup.
  const vidObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        aboutVid.play().catch(() => { });
      } else {
        aboutVid.pause();
      }
    });
  }, { threshold: 0.1 });
  vidObs.observe(aboutVid);
}
function formatHeadingText(text) {
  if (!text) return '';
  const parts = text.split(' ');
  if (parts.length <= 1) return text.toUpperCase();
  const splitIdx = Math.max(1, Math.floor(parts.length / 2));
  const caps = parts.slice(0, splitIdx).join(' ').toUpperCase();
  const italics = parts.slice(splitIdx).join(' ');
  return `${caps} <em>${italics}</em>`;
}

// Format all product titles on the home page
document.querySelectorAll('.pc-title').forEach(title => {
  title.innerHTML = formatHeadingText(title.textContent.trim());
});
