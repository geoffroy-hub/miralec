-- ============================================================
--  Miralocks — Configuration NOUVEAU PROJET Supabase
--  Action : INSTALLATION COMPLETE + PERMISSIONS
--  Copiez tout ce fichier dans : Supabase → SQL Editor → Run
-- ============================================================

-- ══════════════════════════════════════════
-- 1. TABLES
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_settings (
  id         TEXT PRIMARY KEY,
  valeur     TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id         BIGSERIAL PRIMARY KEY,
  titre      TEXT NOT NULL,
  extrait    TEXT,
  contenu    TEXT,
  photo_url  TEXT,
  categorie  TEXT DEFAULT 'Conseil',
  slug       TEXT,
  publie     BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS galerie_photos (
  id          BIGSERIAL PRIMARY KEY,
  titre       TEXT,
  description TEXT,
  photo_url   TEXT NOT NULL,
  categorie   TEXT DEFAULT 'creation',
  ordre       INTEGER DEFAULT 0,
  publie      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS galerie_videos (
  id            BIGSERIAL PRIMARY KEY,
  titre         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  duree         TEXT,
  publie        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avis_clients (
  id         BIGSERIAL PRIMARY KEY,
  nom        TEXT NOT NULL,
  localite   TEXT DEFAULT 'Lomé, Togo',
  etoiles    SMALLINT DEFAULT 5 CHECK (etoiles >= 1 AND etoiles <= 5),
  texte      TEXT NOT NULL,
  approuve   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- 2. PERMISSIONS (GRANT) - CRITIQUE POUR NOUVEAU PROJET
-- ══════════════════════════════════════════

-- Autoriser le rôle anonyme (visiteurs du site) à interagir avec les tables
GRANT SELECT, INSERT ON public.avis_clients TO anon;
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT ON public.galerie_photos TO anon;
GRANT SELECT ON public.galerie_videos TO anon;
GRANT SELECT ON public.site_settings TO anon;

-- Autoriser l'utilisation des séquences (indispensable pour les ID automatiques)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Droits complets pour les admins connectés
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ══════════════════════════════════════════
-- 3. ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════

ALTER TABLE blog_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE galerie_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE galerie_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis_clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;

-- Lecture publique (selon conditions)
CREATE POLICY "public_read_blog"     ON blog_posts      FOR SELECT USING (publie = true);
CREATE POLICY "public_read_galerie"  ON galerie_photos  FOR SELECT USING (publie = true);
CREATE POLICY "public_read_videos"   ON galerie_videos  FOR SELECT USING (publie = true);
CREATE POLICY "public_read_avis"     ON avis_clients    FOR SELECT USING (approuve = true);
CREATE POLICY "public_read_settings" ON site_settings   FOR SELECT USING (true);

-- Insertion d'avis sans connexion
CREATE POLICY "public_insert_avis" ON avis_clients FOR INSERT WITH CHECK (true);

-- Admin : accès total
CREATE POLICY "admin_all_blog"     ON blog_posts     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_galerie"  ON galerie_photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_videos"   ON galerie_videos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_avis"     ON avis_clients   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_settings" ON site_settings  FOR ALL USING (auth.role() = 'authenticated');

-- ══════════════════════════════════════════
-- 4. STOCKAGE (Storage) — Création du bucket + Policies
-- ══════════════════════════════════════════

-- Créer le bucket 'Miralocks-media' (public, pour images/vidéos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Miralocks-media',
  'Miralocks-media',
  true,
  5242880, -- 5 Mo max par fichier
  ARRAY['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Policies de stockage
DROP POLICY IF EXISTS "public_read_storage" ON storage.objects;
CREATE POLICY "public_read_storage" ON storage.objects FOR SELECT USING (bucket_id = 'Miralocks-media');

DROP POLICY IF EXISTS "admin_upload" ON storage.objects;
CREATE POLICY "admin_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'Miralocks-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_update" ON storage.objects;
CREATE POLICY "admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'Miralocks-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_delete" ON storage.objects;
CREATE POLICY "admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'Miralocks-media' AND auth.role() = 'authenticated');

-- ══════════════════════════════════════════
-- 5. PROTECTION ANTI-SPAM (12 avis / heure)
-- ══════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_avis_rate_limit()
RETURNS TRIGGER 
SECURITY DEFINER -- IMPORTANT : Permet de compter tous les avis même si ils sont cachés par le RLS
AS $$
DECLARE avis_count INTEGER;
BEGIN
  -- Compter les avis envoyés dans les 60 dernières minutes
  SELECT count(*) INTO avis_count FROM avis_clients WHERE created_at > NOW() - INTERVAL '1 hour';
  
  IF avis_count >= 12 THEN
    RAISE EXCEPTION 'Limite de sécurité atteinte : Maximum 12 avis par heure.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_avis_rate_limit ON avis_clients;
CREATE TRIGGER trigger_check_avis_rate_limit 
BEFORE INSERT ON avis_clients 
FOR EACH ROW -- Changé en EACH ROW pour plus de fiabilité
EXECUTE FUNCTION check_avis_rate_limit();
