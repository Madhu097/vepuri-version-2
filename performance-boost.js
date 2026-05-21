/**
 * performance-boost.js
 * Fast & smooth image/video loading for Vepuri Agro Products.
 * - Native lazy loading + async decoding on all images
 * - Smooth fade-in when each image becomes visible
 * - Smart video: play only when in viewport, pause when out
 * - Respects data-saver and prefers-reduced-motion
 */
(function () {
  'use strict';

  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var isDataSaver = Boolean(connection && (connection.saveData || /2g/.test(connection.effectiveType || '')));
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsIO = 'IntersectionObserver' in window;

  /* ── 1. IMAGE OPTIMISATION ─────────────────────────────── */
  function optimizeImages() {
    var eagerCutoff = Math.max(window.innerHeight * 1.5, 900);

    document.querySelectorAll('img').forEach(function (img) {
      // Force async decoding for non-blocking render
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');

      // Auto lazy-load images below the fold
      if (!img.hasAttribute('loading')) {
        var rect = img.getBoundingClientRect();
        img.setAttribute('loading', rect.top > eagerCutoff ? 'lazy' : 'eager');
      }

      // Lower priority on data-saver connections
      if (isDataSaver && !img.hasAttribute('fetchpriority')) {
        img.setAttribute('fetchpriority', 'low');
      }

      // Smooth fade-in: mark already-loaded images immediately
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('img-loaded');
      } else {
        img.addEventListener('load', function () {
          img.classList.add('img-loaded');
        }, { once: true });
        img.addEventListener('error', function () {
          img.classList.add('img-loaded'); // still reveal on error to avoid invisible broken images
        }, { once: true });
      }
    });
  }

  /* ── 2. INTERSECTION-BASED IMAGE REVEAL ───────────────── */
  function setupImageReveal() {
    if (!supportsIO) {
      // Fallback: show all images immediately
      document.querySelectorAll('img').forEach(function (img) {
        img.classList.add('img-loaded');
      });
      return;
    }

    var imgObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          // If src is in data-src (manual lazy src), swap it
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            delete img.dataset.srcset;
          }
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '0px 0px 250px 0px' }); // start loading 250px before visible

    document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(function (img) {
      imgObserver.observe(img);
    });
  }

  /* ── 3. VIDEO OPTIMISATION ─────────────────────────────── */
  function optimizeVideos() {
    var videos = Array.from(document.querySelectorAll('video'));
    if (!videos.length) return;

    // On data-saver connections, disable autoplay and set preload=none
    if (isDataSaver) {
      videos.forEach(function (v) { v.preload = 'none'; v.autoplay = false; });
      return;
    }

    if (!supportsIO || reducedMotion) return;

    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          if (video.paused) video.play().catch(function () {});
        } else {
          if (!video.paused) video.pause();
        }
      });
    }, { threshold: 0.25 });

    videos.forEach(function (v) { videoObserver.observe(v); });
  }

  /* ── 4. IFRAME LAZY LOAD ──────────────────────────────── */
  function optimizeIframes() {
    document.querySelectorAll('iframe').forEach(function (iframe) {
      if (!iframe.hasAttribute('loading')) iframe.setAttribute('loading', 'lazy');
    });
  }

  /* ── 5. PAGE LOADED STATE ─────────────────────────────── */
  function markLoaded() {
    document.body.classList.add('loaded');
    var loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('gone');
      setTimeout(function () { loader.style.display = 'none'; }, 700);
    }
  }

  /* ── 6. SERVICE WORKER REGISTRATION (FULL PAGE CACHING) ──── */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(function (reg) {
          console.log('[Service Worker] Registration successful with scope:', reg.scope);
        })
        .catch(function (err) {
          console.warn('[Service Worker] Registration failed:', err);
        });
    }
  }

  /* ── INIT ─────────────────────────────────────────────── */
  function run() {
    optimizeImages();
    setupImageReveal();
    optimizeVideos();
    optimizeIframes();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  window.addEventListener('load', markLoaded, { once: true });
})();
