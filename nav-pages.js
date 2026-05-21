(function () {
  // -- GLOBAL LOADER --
  const loaderEl = document.getElementById('loader');
  function hideLoader() {
    if (!loaderEl) return;
    loaderEl.classList.add('gone');
    document.body.classList.add('loaded');
  }
  window.addEventListener('load', () => setTimeout(hideLoader, 300));
  // Fallback
  window.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 1500));
  window.addEventListener('pageshow', hideLoader);

  // ── Anchor-hash re-scroll fix ─────────────────────────────────────────────
  // content-visibility:auto collapses off-screen sections during initial load,
  // so the browser's native hash scroll overshoots (e.g. #dept-contacts ends
  // up at #enquiryForm). We wait for layout to stabilise then re-scroll.
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
    // First attempt after load + 2 animation frames (layout settled)
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToHash(hash)));
    // Second attempt after 500ms (handles slow content-visibility expansion)
    setTimeout(() => scrollToHash(hash), 500);
  }

  window.addEventListener('load', fixHashScroll);

  const nav = document.getElementById('nav');
  const navLinks = document.getElementById('navLinks');
  const hbg = document.getElementById('hbg');

  if (!nav || !navLinks || !hbg) return;

  window.toggleNav = function toggleNav() {
    const isOpen = navLinks.classList.toggle('open');
    hbg.classList.toggle('active', isOpen);
    if (!isOpen) {
      document.querySelectorAll('.has-submenu').forEach(function (li) {
        li.classList.remove('open');
      });
    }
  };

  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  function isMobileNav() {
    return window.matchMedia('(max-width: 1080px)').matches;
  }

  document.querySelectorAll('.has-submenu > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!isMobileNav()) return;
      e.preventDefault();
      a.parentElement.classList.toggle('open');
    });
  });

  // Improved Nav & Anchor Scroll
  document.addEventListener('click', function (e) {
    const target = e.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    
    // Close menu if clicking any link on mobile (except submenus)
    if (isMobileNav() && !target.closest('.has-submenu')) {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        hbg.classList.remove('active');
      }
    }

    // Extract hash if it points to an anchor on the same page
    let hash = '';
    if (href) {
      if (href.startsWith('#')) {
        hash = href;
      } else if (href.includes('#')) {
        try {
          const url = new URL(target.href);
          const currentUrl = new URL(window.location.href);
          const isSamePage = url.origin === currentUrl.origin && 
            (url.pathname === currentUrl.pathname || 
             url.pathname.replace(/^\/|\/$/g, '') === currentUrl.pathname.replace(/^\/|\/$/g, '') ||
             (url.pathname.endsWith(currentUrl.pathname.split('/').pop()) && currentUrl.pathname.split('/').pop() !== ''));
          
          if (isSamePage) {
            hash = url.hash;
          }
        } catch (err) {
          // Fallback
        }
      }
    }

    // Smooth scroll for internal anchors on the SAME page with content-visibility auto correction
    if (hash && hash.length > 1) {
      const el = document.querySelector(hash);
      if (el) {
        e.preventDefault();
        const NAV_HEIGHT = 85;
        
        // Perform initial scroll calculation
        let targetTop = el.getBoundingClientRect().top + window.pageYOffset - NAV_HEIGHT;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
        
        // Dynamically correct the scroll destination as off-screen content-visibility sections expand
        let attempts = 0;
        const scrollCorrectionTimer = setInterval(function () {
          attempts++;
          const currentTop = el.getBoundingClientRect().top + window.pageYOffset - NAV_HEIGHT;
          if (Math.abs(currentTop - targetTop) > 3) {
            targetTop = currentTop;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          }
          if (attempts >= 10) {
            clearInterval(scrollCorrectionTimer);
          }
        }, 80);
      }
    }
  });

  // Scroll Reveal Observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.rv').forEach(el => revealObserver.observe(el));

  // Automatic Hover/Highlight on Scroll for Certification Tiles on Mobile/Responsive
  const certTiles = document.querySelectorAll('.cert-tile');
  if (certTiles.length > 0) {
    const isResponsive = () => window.innerWidth <= 1080;
    
    const certObserver = new IntersectionObserver((entries) => {
      if (!isResponsive()) {
        entries.forEach(entry => entry.target.classList.remove('active-hover'));
        return;
      }
      
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active-hover');
        } else {
          entry.target.classList.remove('active-hover');
        }
      });
    }, {
      // 25% from top and 25% from bottom creates a 50% active zone in the center of the viewport
      rootMargin: '-25% 0px -25% 0px',
      threshold: 0
    });
    
    certTiles.forEach(tile => certObserver.observe(tile));
    
    // Clean up classes if screen width is resized past the responsive breakpoint
    window.addEventListener('resize', () => {
      if (!isResponsive()) {
        certTiles.forEach(tile => tile.classList.remove('active-hover'));
      }
    }, { passive: true });
  }
})();
