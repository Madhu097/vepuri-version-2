(function () {
  // -- GLOBAL LOADER --
  const loaderEl = document.getElementById('loader');
  function hideLoader() {
    if (!loaderEl) return;
    loaderEl.classList.add('gone');
    document.body.classList.add('loaded');
  }
  window.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 50));
  window.addEventListener('load', hideLoader);
  window.addEventListener('pageshow', hideLoader);



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
        setTimeout(() => {
          navLinks.classList.remove('open');
          hbg.classList.remove('active');
        }, 150);
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
