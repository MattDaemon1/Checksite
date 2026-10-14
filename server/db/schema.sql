-- CheckSite by Matt Konnect - SQLite Schema

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  website_url TEXT NOT NULL,
  company_name TEXT,
  business_activity TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  consent_text_version TEXT,
  consented_at TEXT,
  source TEXT DEFAULT 'landing_form',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'error')),
  http_code INTEGER,
  response_time_ms INTEGER,
  ssl_valid INTEGER,
  title TEXT,
  meta_description TEXT,
  h1_count INTEGER,
  missing_alt_images_count INTEGER,
  robots_txt_exists INTEGER,
  sitemap_exists INTEGER,
  broken_links_count INTEGER,
  pagespeed_scores TEXT,
  summary TEXT,
  raw_details TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audits_lead_id ON audits(lead_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events(created_at);
