(function () {
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

    // Smooth scroll for internal anchors on the SAME page
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

  // Scroll Reveal Observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.rv').forEach(el => revealObserver.observe(el));
})();
