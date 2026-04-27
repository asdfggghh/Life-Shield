CREATE TABLE IF NOT EXISTS public.profiles (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  age                     INTEGER,
  gender                  TEXT,
  phone                   TEXT,
  blood_group             TEXT NOT NULL,
  allergies               TEXT,
  medications             TEXT,
  conditions              TEXT,
  notes                   TEXT,
  is_donor                BOOLEAN DEFAULT FALSE,
  emergency_contact_name  TEXT,
  emergency_contact       TEXT NOT NULL,
  emergency_contact2_name TEXT,
  emergency_contact2      TEXT,
  address                 TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  accuracy    DOUBLE PRECISION,
  city        TEXT,
  scanned_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sos_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  maps_link    TEXT,
  status       TEXT DEFAULT 'sent',
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by anyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Profiles can be inserted by anyone"
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Profiles can be updated by anyone"
  ON public.profiles FOR UPDATE USING (true);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scans are insertable by anyone"
  ON public.scans FOR INSERT WITH CHECK (true);

CREATE POLICY "Scans are readable by anyone"
  ON public.scans FOR SELECT USING (true);

ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SOS events are insertable by anyone"
  ON public.sos_events FOR INSERT WITH CHECK (true);

CREATE POLICY "SOS events are readable by anyone"
  ON public.sos_events FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_scans_profile_id ON public.scans(profile_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_profile_id ON public.sos_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_blood ON public.profiles(blood_group);
