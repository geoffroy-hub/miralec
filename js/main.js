/* ============================================================
   Miralocks — main.js (version optimisée)
   ============================================================ */

'use strict';

// ── Loader ──────────────────────────────────────────────────────
const loader = document.getElementById('page-loader');
if (loader) {
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 300);
  });
  // Fallback : masquer après 3s si load ne se déclenche pas
  setTimeout(() => loader && loader.classList.add('hidden'), 3000);
}

// ── Nav scroll ──────────────────────────────────────────────────
const nav = document.querySelector('.nav');
if (nav) {
  let lastScroll = 0;
  let ticking = false;
  const updateNav = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 50);
    lastScroll = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateNav); ticking = true; }
  }, { passive: true });
}

// ── Hamburger menu ───────────────────────────────────────────────
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Créer l'overlay dynamiquement
let navOverlay = document.querySelector('.nav-overlay');
if (!navOverlay) {
  navOverlay = document.createElement('div');
  navOverlay.className = 'nav-overlay';
  document.body.appendChild(navOverlay);
}

function openNav() {
  hamburger.classList.add('open');
  navLinks.classList.add('open');
  navOverlay.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeNav() {
  hamburger.classList.remove('open');
  navLinks.classList.remove('open');
  navOverlay.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

if (hamburger && navLinks) {
  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    hamburger.classList.contains('open') ? closeNav() : openNav();
  });

  // Clic sur un lien du menu — laisser la navigation se faire normalement
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      // Ne pas bloquer le lien, juste fermer le menu
      closeNav();
      // La navigation se fait naturellement après
    });
  });

  // Fermer en cliquant sur l'overlay
  navOverlay.addEventListener('click', closeNav);

  // Fermer avec Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
}

// ── Active nav link ──────────────────────────────────────────────
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    a.classList.add('active');
  }
});

// ── Fade-in sur scroll (IntersectionObserver) ────────────────────
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
}

// ── FAQ accordion ────────────────────────────────────────────────
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-question');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // Fermer tous
    document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
    // Ouvrir celui-ci si pas déjà ouvert
    if (!isOpen) item.classList.add('open');
  });
});

// ── FAQ filtres ──────────────────────────────────────────────────
document.querySelectorAll('.faq-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.faq-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    document.querySelectorAll('.faq-item').forEach(item => {
      const show = cat === 'tout' || item.dataset.cat === cat;
      item.style.display = show ? '' : 'none';
    });
  });
});

// ── Avant/Après slider ───────────────────────────────────────────
function initSliders() {
  // Détecter si l'appareil est tactile (mobile/tablette)
  var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  document.querySelectorAll('.ba-item').forEach(function (item) {
    var before = item.querySelector('.ba-before');
    var after = item.querySelector('.ba-after');
    var divider = item.querySelector('.ba-divider');
    var handle = item.querySelector('.ba-handle');
    if (!before || !after) return;

    // Sur mobile : désactiver complètement le slider, afficher les deux images côte à côte
    if (isTouchDevice) {
      item.classList.add('ba-mobile-static');
      return;
    }

    var pct = 50;
    var dragging = false;

    function applyPos(p) {
      pct = Math.min(Math.max(p, 1), 99);
      before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      after.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      if (divider) divider.style.left = pct + '%';
      if (handle) {
        handle.style.left = pct + '%';
        handle.style.top = '50%';
      }
    }

    function getPct(clientX) {
      var rect = item.getBoundingClientRect();
      return (clientX - rect.left) / rect.width * 100;
    }

    // ── Mouse uniquement (desktop) ──
    item.addEventListener('mousedown', function (e) {
      dragging = true;
      applyPos(getPct(e.clientX));
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (dragging) applyPos(getPct(e.clientX));
    });
    document.addEventListener('mouseup', function () { dragging = false; });

    // Position initiale
    applyPos(50);
  });
}

// Lancer après chargement complet
if (document.readyState === 'complete') {
  initSliders();
} else {
  window.addEventListener('load', initSliders);
}

// ── Lightbox ─────────────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const lbImg = lightbox?.querySelector('.lightbox-img');
const lbClose = lightbox?.querySelector('.lightbox-close');
const lbPrev = lightbox?.querySelector('.lightbox-prev');
const lbNext = lightbox?.querySelector('.lightbox-next');
let lbItems = [];
let lbIndex = 0;

if (lightbox) {
  const openLightbox = (items, index) => {
    lbItems = items; lbIndex = index;
    lbImg.src = items[index].src;
    lbImg.alt = items[index].alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };
  const showAdj = (dir) => {
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = lbItems[lbIndex].src;
      lbImg.style.opacity = '1';
    }, 180);
  };

  lbClose?.addEventListener('click', closeLightbox);
  lbPrev?.addEventListener('click', () => showAdj(-1));
  lbNext?.addEventListener('click', () => showAdj(1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showAdj(-1);
    if (e.key === 'ArrowRight') showAdj(1);
  });

  // Galerie cliquable — EXACTEMENT comme la version originale qui fonctionnait
  const galleryImgs = Array.from(document.querySelectorAll('.gallery-item img'));
  galleryImgs.forEach((img, i) => {
    img.closest('.gallery-item').addEventListener('click', () => {
      openLightbox(galleryImgs.map(im => ({ src: im.src, alt: im.alt })), i);
    });
  });
}

// ── Stats counter ────────────────────────────────────────────────
const statsSection = document.querySelector('.stats');
if (statsSection && 'IntersectionObserver' in window) {
  const countUp = (el, target, suffix) => {
    let current = 0;
    const step = Math.ceil(target / 60);
    const tick = () => {
      current = Math.min(current + step, target);
      el.textContent = current + suffix;
      if (current < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const statsIo = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    statsIo.disconnect();
    document.querySelectorAll('.stat-number[data-target]').forEach(el => {
      countUp(el, +el.dataset.target, el.dataset.suffix || '');
    });
  }, { threshold: 0.5 });
  statsIo.observe(statsSection);
}

// ── Cookie banner ────────────────────────────────────────────────
const cookieBanner = document.querySelector('.cookie-banner');
if (cookieBanner && !localStorage.getItem('Miralocks_cookies')) {
  setTimeout(() => cookieBanner.classList.add('visible'), 1500);
  cookieBanner.querySelector('.cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('Miralocks_cookies', '1');
    cookieBanner.classList.remove('visible');
  });
  cookieBanner.querySelector('.cookie-refuse')?.addEventListener('click', () => {
    localStorage.setItem('Miralocks_cookies', '0');
    cookieBanner.classList.remove('visible');
  });
}

// ── Formulaire RDV → WhatsApp ─────────────────────────────────────
const rdvForm = document.getElementById('rdvForm');
if (rdvForm) {
  rdvForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(rdvForm));
    const msg = `Bonjour Miralocks 👋
Je souhaite prendre rendez-vous.

📋 *Nom* : ${data.nom || ''}
📞 *Téléphone* : ${data.tel || ''}
💆 *Service* : ${data.service || ''}
📅 *Date souhaitée* : ${data.date || ''}
🕐 *Heure souhaitée* : ${data.heure || ''}
📝 *Message* : ${data.message || '(aucun)'}`;
    const url = `https://wa.me/22897989001?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

// Theme initialization logic
(function () {
  const theme = localStorage.getItem('Miralocks_theme') || 'light';
  document.documentElement.dataset.theme = theme;
})();

// ── Theme toggle logic ──────────────────────────────────────────
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Set initial icon
  const updateIcon = (theme) => {
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      html.dataset.theme = 'dark';
    } else {
      icon.className = 'fas fa-moon';
      html.dataset.theme = 'light';
    }
  };

  const currentTheme = localStorage.getItem('Miralocks_theme') || 'light';
  updateIcon(currentTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('Miralocks_theme', newTheme);
      updateIcon(newTheme);
    });
  }
}
document.addEventListener('DOMContentLoaded', initTheme);

// ── Theme loader (safe) ──────────────────────────────────────────

// ── PWA Install prompt ────────────────────────────────────────────
let deferredPrompt;
const pwaBanner = document.querySelector('.pwa-banner');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  if (pwaBanner) pwaBanner.classList.add('show');
});
document.querySelector('.pwa-install')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted' && pwaBanner) pwaBanner.classList.remove('show');
  deferredPrompt = null;
});
document.querySelector('.pwa-dismiss')?.addEventListener('click', () => {
  if (pwaBanner) pwaBanner.classList.remove('show');
});

// ── Accès Admin secret ────────────────────────────────────────────
// Desktop  : Ctrl + Shift + A
// Mobile   : triple tap sur le logo nav en moins de 1.5s
(function () {
  var ADMIN_URL = 'admin.html';

  // Raccourci clavier desktop
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.location.href = ADMIN_URL;
    }
  });

  // Triple tap logo
  var logo = document.querySelector('.nav-logo');
  if (!logo) return;

  var taps = 0, tapTimer = null, lastTap = 0;

  logo.addEventListener('click', function (e) {
    var now = Date.now();
    if (now - lastTap > 1500) taps = 0;
    lastTap = now;
    taps++;

    // Bloquer la navigation uniquement pendant le comptage
    e.preventDefault();
    // PAS de stopPropagation — ça bloquait les liens du menu
    clearTimeout(tapTimer);

    if (taps >= 3) {
      taps = 0;
      logo.style.transition = 'opacity .15s';
      logo.style.opacity = '.3';
      setTimeout(function () {
        logo.style.opacity = '';
        window.location.href = ADMIN_URL;
      }, 200);
    } else {
      tapTimer = setTimeout(function () {
        if (taps > 0) {
          taps = 0;
          window.location.href = logo.getAttribute('href') || 'index.html';
        }
      }, 1500);
    }
  });
})();
