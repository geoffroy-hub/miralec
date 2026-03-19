/* ============================================================
   Miralocks — supabase.js
   Gestionnaire centralisé de toutes les API Supabase
   ============================================================ */

const SUPABASE_URL = 'https://mspgaewvgbaotclnhjvw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcGdhZXd2Z2Jhb3RjbG5oanZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDAyMTUsImV4cCI6MjA4ODUxNjIxNX0.QWBNvieqoF_pwL_yq7QxmvFSS6p_MzENtR9sVgnZoJI';
const SUPABASE_BUCKET = 'Miralocks-media';

/* ── Client Supabase léger (sans SDK, fetch natif) ─────────── */
const sb = {

  /* headers communs */
  _h(token = null) {
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${token || SUPABASE_ANON}`,
      'Prefer': 'return=representation',
    };
  },

  /* ── Générer un slug unique ──────────────────────────────── */
  _slug(titre) {
    return titre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlever accents
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')
      + '-' + Date.now().toString(36);
  },

  /* ── AUTH ────────────────────────────────────────────────── */
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.msg || 'Connexion échouée');
    localStorage.setItem('ml_session', JSON.stringify({
      token: data.access_token,
      refresh: data.refresh_token,
      email,
      expires: Date.now() + data.expires_in * 1000,
    }));
    return data;
  },

  async signOut() {
    const s = sb.getSession();
    if (s) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: sb._h(s.token),
      }).catch(() => { });
    }
    localStorage.removeItem('ml_session');
  },

  getSession() {
    try {
      const s = JSON.parse(localStorage.getItem('ml_session'));
      if (!s || Date.now() > s.expires) { localStorage.removeItem('ml_session'); return null; }
      return s;
    } catch { return null; }
  },

  isAdmin() { return !!sb.getSession(); },

  /* ── STORAGE — upload fichier ────────────────────────────── */
  async upload(folder, file) {
    const s = sb.getSession();
    if (!s) throw new Error('Non authentifié');
    const ext = file.name.split('.').pop().toLowerCase();
    const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    // Content-Type correct selon le type de fichier
    const ct = file.type || 'application/octet-stream';
    const r = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${name}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${s.token}`,
          'Content-Type': ct,
          'Cache-Control': '3600',
        },
        body: file,
      }
    );
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || e.error || `Upload échoué (${r.status})`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${name}`;
  },

  async deleteFile(url) {
    const s = sb.getSession();
    if (!s) return;
    const path = url.split(`/${SUPABASE_BUCKET}/`)[1];
    if (!path) return;
    await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${s.token}` },
    }).catch(() => { });
  },

  /* ── CRUD générique ──────────────────────────────────────── */
  async _get(table, params = '') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${sb.getSession()?.token || SUPABASE_ANON}`,
      },
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || `Erreur lecture ${table} (${r.status})`);
    }
    return r.json();
  },

  async _post(table, body) {
    const s = sb.getSession();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: sb._h(s?.token),
      body: JSON.stringify(body),
    });
    // Supabase peut renvoyer 201 (Created) ou 200
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || e.details || `Erreur création ${table} (${r.status})`);
    }
    // 201 peut avoir un body vide ou un tableau
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  },

  async _patch(table, id, body) {
    const s = sb.getSession();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: sb._h(s?.token),
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || e.details || `Erreur mise à jour ${table} (${r.status})`);
    }
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  },

  async _delete(table, id) {
    const s = sb.getSession();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${s?.token || SUPABASE_ANON}`,
        'Prefer': 'return=minimal',
      },
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || `Erreur suppression ${table} (${r.status})`);
    }
  },

  /* ══════════════════════════════════════════════════════════
     BLOG
     Table: blog_posts
     Colonnes: id, titre, extrait, contenu, photo_url,
               categorie, slug, publie, created_at
  ══════════════════════════════════════════════════════════ */
  blog: {
    async list(onlyPublished = true) {
      const filter = onlyPublished ? 'publie=eq.true&' : '';
      return sb._get('blog_posts', `${filter}order=created_at.desc`);
    },
    async get(id) {
      const rows = await sb._get('blog_posts', `id=eq.${id}`);
      return rows[0] || null;
    },
    async create(data) {
      // Générer le slug automatiquement si absent
      if (!data.slug) data.slug = sb._slug(data.titre || 'article');
      return sb._post('blog_posts', data);
    },
    async update(id, data) {
      // Mettre à jour le slug si le titre a changé et qu'aucun slug n'est fourni
      if (data.titre && !data.slug) data.slug = sb._slug(data.titre);
      return sb._patch('blog_posts', id, data);
    },
    async delete(id, photoUrl) {
      if (photoUrl) await sb.deleteFile(photoUrl).catch(() => { });
      return sb._delete('blog_posts', id);
    },
    async togglePublish(id, current) {
      return sb._patch('blog_posts', id, { publie: !current });
    },
  },

  /* ══════════════════════════════════════════════════════════
     GALERIE PHOTOS
     Table: galerie_photos
     Colonnes: id, titre, description, photo_url,
               categorie, ordre, publie, created_at
  ══════════════════════════════════════════════════════════ */
  galerie: {
    async list(onlyPublished = true) {
      const filter = onlyPublished ? 'publie=eq.true&' : '';
      return sb._get('galerie_photos', `${filter}order=ordre.asc,created_at.desc`);
    },
    async create(data) { return sb._post('galerie_photos', data); },
    async update(id, data) { return sb._patch('galerie_photos', id, data); },
    async delete(id, photoUrl) {
      if (photoUrl) await sb.deleteFile(photoUrl).catch(() => { });
      return sb._delete('galerie_photos', id);
    },
    async togglePublish(id, current) {
      return sb._patch('galerie_photos', id, { publie: !current });
    },
  },

  /* ══════════════════════════════════════════════════════════
     VIDÉOS
     Table: galerie_videos
     Colonnes: id, titre, description, video_url,
               thumbnail_url, duree, publie, created_at
  ══════════════════════════════════════════════════════════ */
  videos: {
    async list(onlyPublished = true) {
      const filter = onlyPublished ? 'publie=eq.true&' : '';
      return sb._get('galerie_videos', `${filter}order=created_at.desc`);
    },
    async create(data) { return sb._post('galerie_videos', data); },
    async update(id, data) { return sb._patch('galerie_videos', id, data); },
    async delete(id, videoUrl, thumbUrl) {
      if (videoUrl) await sb.deleteFile(videoUrl).catch(() => { });
      if (thumbUrl) await sb.deleteFile(thumbUrl).catch(() => { });
      return sb._delete('galerie_videos', id);
    },
    async togglePublish(id, current) {
      return sb._patch('galerie_videos', id, { publie: !current });
    },
  },

  /* ══════════════════════════════════════════════════════════
     AVIS CLIENTS
     Table: avis_clients
     Colonnes: id, nom, localite, etoiles (1-5),
               texte, approuve, created_at
  ══════════════════════════════════════════════════════════ */
  avis: {
    async list(onlyApproved = true) {
      const filter = onlyApproved ? 'approuve=eq.true&' : '';
      return sb._get('avis_clients', `${filter}order=created_at.desc`);
    },
    // INSERT public (sans token admin) — RLS doit autoriser INSERT pour anon
    async create(data) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/avis_clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ ...data, approuve: false }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.message || e.details || `Erreur envoi avis (${r.status})`);
      }
    },
    async approve(id) { return sb._patch('avis_clients', id, { approuve: true }); },
    async reject(id) { return sb._delete('avis_clients', id); },
    async delete(id) { return sb._delete('avis_clients', id); },
  },

  /* ══════════════════════════════════════════════════════════
     PARAMÈTRES SITE
     Table: site_settings
     Colonnes: id (text PK), valeur (text), updated_at
  ══════════════════════════════════════════════════════════ */
  settings: {
    async get(key) {
      const rows = await sb._get('site_settings', `id=eq.${encodeURIComponent(key)}`);
      return rows[0]?.valeur || null;
    },
    async set(key, valeur) {
      const s = sb.getSession();
      const r = await fetch(`${SUPABASE_URL}/rest/v1/site_settings`, {
        method: 'POST',
        headers: {
          ...sb._h(s?.token),
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({ id: key, valeur, updated_at: new Date().toISOString() }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'Erreur sauvegarde'); }
      const text = await r.text();
      return text ? JSON.parse(text) : [];
    },
    async delete(key) {
      const s = sb.getSession();
      await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${s?.token}`, 'Prefer': 'return=minimal' },
      });
    },
    async getAll() {
      return sb._get('site_settings', '');
    },
  },
};

/* Exposer globalement */
window.sb = sb;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON = SUPABASE_ANON;

