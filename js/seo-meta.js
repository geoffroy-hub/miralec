/* ============================================================
   Miralocks — seo-meta.js
   Gestion centralisée des balises SEO, Open Graph & Twitter Card
   → Prévisualisation sur WhatsApp, Facebook, Twitter/X, iMessage
   ============================================================ */

const SEO = {

  /* ── Config globale du site ──────────────────────────────── */
  site: {
    name: 'Miralocks',
    // On récupère dynamiquement l'URL (ex: https://miralocks.netlify.app ou localhost)
    url: window.location.origin, 
    locale: 'fr_TG',
    twitterHandle: '',                      // ex: '@Miralocks' si compte Twitter
    ogImage: window.location.origin + '/assets/og-image.jpg',
    ogImageW: 1200,
    ogImageH: 630,
    ogImageAlt: 'Miralocks — Spécialiste locks à Lomé, Togo',
    themeColor: '#0C3320',
    phone: '+22897989001',
    address: 'Agoè Cacaveli, Lomé, Togo',
    lat: '6.224345',
    lng: '1.193420',
  },

  /* ── Métadonnées par page ────────────────────────────────── */
  pages: {
    'index.html': {
      title: 'Miralocks — Spécialiste Locks à Lomé, Togo',
      description: 'Miralocks, expert en locks et cheveux naturels à Lomé, Togo. Création, entretien, resserrage, coloration. Réservez votre RDV au +228 97 98 90 01.',
      keywords: 'locks Lomé, dreadlocks Togo, institut capillaire Lomé, resserrage locks, création locks Togo, Miralocks',
      type: 'website',
      image: null, // utilise l'image globale
    },
    'gallery.html': {
      title: 'Galerie — Miralocks | Créations locks Lomé',
      description: 'Découvrez nos réalisations en photos et vidéos. Locks micro, sisterlocks, crochet instantané… Toutes nos créations à Lomé, Togo.',
      keywords: 'galerie locks, photos locks Lomé, sisterlocks Togo, crochet locks, créations capillaires',
      type: 'website',
    },
    'services.html': {
      title: 'Services & Tarifs — Miralocks Lomé',
      description: 'Tous nos services locks à Lomé : création, entretien, resserrage, coloration, défrisage. Tarifs transparents dès 2 000 FCFA. Réservez en ligne.',
      keywords: 'tarifs locks Lomé, prix resserrage locks, entretien locks Togo, services capillaires',
      type: 'website',
    },
    'rendezvous.html': {
      title: 'Prendre Rendez-vous — Miralocks Lomé',
      description: 'Réservez votre séance à Miralocks en quelques secondes. Ouvert Mardi–Samedi 08h–18h. +228 97 98 90 01.',
      keywords: 'rendez-vous locks Lomé, réservation salon locks Togo',
      type: 'website',
    },
    'contact.html': {
      title: 'Contact & Localisation — Miralocks Lomé',
      description: 'Trouvez-nous à Agoè Cacaveli, près de l\'école La Source. Contactez Miralocks par WhatsApp, téléphone ou en ligne.',
      keywords: 'contact Miralocks, adresse salon locks Lomé, localisation institut capillaire Togo',
      type: 'website',
    },
    'about.html': {
      title: 'À propos — Miralocks | Institut locks Lomé',
      description: 'Découvrez l\'histoire d\'Miralocks, fondé par Akossiwa Miriam ABOTCHI. Passion des locks et des cheveux naturels à Lomé, Togo.',
      keywords: 'histoire Miralocks, Miriam ABOTCHI, fondatrice salon locks Lomé',
      type: 'website',
    },
    'avis.html': {
      title: 'Avis Clients — Miralocks Lomé',
      description: 'Les témoignages de nos clientes. Miralocks, salon locks 5 étoiles à Lomé, Togo. Partagez votre expérience !',
      keywords: 'avis Miralocks, témoignages salon locks Lomé, note clients',
      type: 'website',
    },
    'blog.html': {
      title: 'Blog — Miralocks | Conseils locks & cheveux',
      description: 'Conseils d\'expertes pour entretenir, créer et sublimer vos locks. Articles, tutoriels et actualités capillaires par Miralocks.',
      keywords: 'blog locks, conseils dreadlocks, entretien locks naturels, tutos capillaires Togo',
      type: 'website',
    },
    'faq.html': {
      title: 'FAQ — Miralocks | Questions fréquentes',
      description: 'Toutes vos questions sur les locks : durée, prix, entretien, douleur… Réponses expertes par l\'Miralocks de Lomé.',
      keywords: 'FAQ locks, questions dreadlocks, combien coûte locks, durée création locks',
      type: 'website',
    },
    'mentions-legales.html': {
      title: 'Mentions légales — Miralocks',
      description: 'Mentions légales du site web de l\'Miralocks, Lomé, Togo.',
      keywords: '',
      type: 'website',
      noindex: true,
    },
    'confidentialite.html': {
      title: 'Politique de confidentialité — Miralocks',
      description: 'Politique de confidentialité et protection des données personnelles — Miralocks.',
      keywords: '',
      type: 'website',
      noindex: true,
    },
  },

  /* ── Injection des balises ───────────────────────────────── */
  inject(pageKey) {
    const cfg = this.pages[pageKey] || this.pages['index.html'];
    const s = this.site;
    const url = `${s.url}/${pageKey === 'index.html' ? '' : pageKey}`;
    const img = cfg.image || s.ogImage;
    const head = document.head;

    // Helper : créer/mettre à jour une meta
    const setMeta = (attr, val, content) => {
      let el = head.querySelector(`meta[${attr}="${val}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, val); head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const setLink = (rel, href) => {
      let el = head.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); head.appendChild(el); }
      el.setAttribute('href', href);
    };

    /* ── Canonical ─────────────────────────────────────────── */
    setLink('canonical', url);

    /* ── Robots ────────────────────────────────────────────── */
    setMeta('name', 'robots',
      cfg.noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large'
    );

    /* ── SEO basique ───────────────────────────────────────── */
    setMeta('name', 'description', cfg.description);
    if (cfg.keywords) setMeta('name', 'keywords', cfg.keywords);
    setMeta('name', 'author', 'Miralocks');
    setMeta('name', 'theme-color', s.themeColor);

    /* ── Open Graph (Facebook, WhatsApp, LinkedIn…) ─────────── */
    setMeta('property', 'og:type', cfg.type || 'website');
    setMeta('property', 'og:site_name', s.name);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:title', cfg.title);
    setMeta('property', 'og:description', cfg.description);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:image:url', img);
    setMeta('property', 'og:image:width', String(s.ogImageW));
    setMeta('property', 'og:image:height', String(s.ogImageH));
    setMeta('property', 'og:image:alt', s.ogImageAlt);
    setMeta('property', 'og:image:type', 'image/jpeg');
    setMeta('property', 'og:locale', s.locale);

    /* ── Twitter / X Card ──────────────────────────────────── */
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', cfg.title);
    setMeta('name', 'twitter:description', cfg.description);
    setMeta('name', 'twitter:image', img);
    setMeta('name', 'twitter:image:alt', s.ogImageAlt);
    if (s.twitterHandle) setMeta('name', 'twitter:site', s.twitterHandle);

    /* ── WhatsApp optimisation spécifique ──────────────────── */
    // WhatsApp utilise og:image — s'assurer que c'est accessible
    // Taille idéale : 1200×630, format JPG/PNG, max 8MB
    setMeta('property', 'og:image:secure_url', img);

    /* ── Schema.org JSON-LD (Google Rich Results) ──────────── */
    const existingLD = head.querySelector('script[type="application/ld+json"]');
    if (existingLD) existingLD.remove();
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HairSalon",
      "name": s.name,
      "url": s.url,
      "logo": `${s.url}/assets/logo-or.png`,
      "image": img,
      "description": cfg.description,
      "telephone": s.phone,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Agoè Cacaveli, près de l'école La Source",
        "addressLocality": "Lomé",
        "addressRegion": "Maritime",
        "addressCountry": "TG"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": s.lat,
        "longitude": s.lng
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "08:00",
          "closes": "18:00"
        }
      ],
      "priceRange": "2000 FCFA – 100000 FCFA",
      "currenciesAccepted": "XOF",
      "paymentAccepted": "Cash, Mobile Money",
      "sameAs": [
        "https://www.instagram.com/institut_Miralocks",
        "https://www.facebook.com/mira.lachocote",
        "https://www.tiktok.com/@institut_mira_locks228"
      ]
    });
    head.appendChild(ld);

    /* ── Titre de la page ──────────────────────────────────── */
    document.title = cfg.title;
  },

  /* ── Auto-détection de la page courante ─────────────────── */
  init() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const key = page === '' ? 'index.html' : page;
    this.inject(key in this.pages ? key : 'index.html');
  },
};

/* ── Lancement automatique ───────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SEO.init());
} else {
  SEO.init();
}

window.SEO = SEO;
