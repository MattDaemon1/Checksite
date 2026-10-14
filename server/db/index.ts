import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.dirname(path.resolve(config.dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Enable WAL mode & foreign keys for performance and data integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Schema
const schemaPath = path.join(__dirname, 'schema.sql');
let schemaSql = '';
if (fs.existsSync(schemaPath)) {
  schemaSql = fs.readFileSync(schemaPath, 'utf8');
} else {
  schemaSql = `
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
  `;
}
db.exec(schemaSql);

export interface LeadRecord {
  id: string;
  email: string;
  website_url: string;
  company_name?: string | null;
  business_activity?: string | null;
  marketing_consent: number; // 0 or 1
  consent_text_version?: string | null;
  consented_at?: string | null;
  source?: string | null;
  created_at: string;
}

export interface AuditRecord {
  id: string;
  lead_id: string;
  access_token: string;
  url: string;
  domain: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  http_code?: number | null;
  response_time_ms?: number | null;
  ssl_valid?: number | null;
  title?: string | null;
  meta_description?: string | null;
  h1_count?: number | null;
  missing_alt_images_count?: number | null;
  robots_txt_exists?: number | null;
  sitemap_exists?: number | null;
  broken_links_count?: number | null;
  pagespeed_scores?: string | null; // JSON
  summary?: string | null; // JSON
  raw_details?: string | null; // JSON
  error_message?: string | null;
  created_at: string;
  finished_at?: string | null;
}

// Prepared Statements & DB operations
export const dbOps = {
  createLead: (lead: LeadRecord) => {
    const stmt = db.prepare(`
      INSERT INTO leads (id, email, website_url, company_name, business_activity, marketing_consent, consent_text_version, consented_at, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      lead.id,
      lead.email,
      lead.website_url,
      lead.company_name ?? null,
      lead.business_activity ?? null,
      lead.marketing_consent,
      lead.consent_text_version ?? null,
      lead.consented_at ?? null,
      lead.source ?? 'landing_form',
      lead.created_at
    );
  },

  findRecentLead: (email: string, websiteUrl: string): LeadRecord | undefined => {
    const stmt = db.prepare(`
      SELECT * FROM leads 
      WHERE LOWER(email) = LOWER(?) AND LOWER(website_url) = LOWER(?)
      ORDER BY datetime(created_at) DESC LIMIT 1
    `);
    return stmt.get(email, websiteUrl) as LeadRecord | undefined;
  },

  getLeadById: (id: string): LeadRecord | undefined => {
    const stmt = db.prepare(`SELECT * FROM leads WHERE id = ?`);
    return stmt.get(id) as LeadRecord | undefined;
  },

  updateLeadConsent: (id: string, consent: number, version: string, consentedAt: string | null) => {
    const stmt = db.prepare(`
      UPDATE leads 
      SET marketing_consent = ?, consent_text_version = ?, consented_at = ?
      WHERE id = ?
    `);
    stmt.run(consent, version, consentedAt, id);
  },

  createAudit: (audit: AuditRecord) => {
    const stmt = db.prepare(`
      INSERT INTO audits (
        id, lead_id, access_token, url, domain, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      audit.id,
      audit.lead_id,
      audit.access_token,
      audit.url,
      audit.domain,
      audit.status,
      audit.created_at
    );
  },

  updateAuditProgress: (id: string, status: 'running' | 'completed' | 'error', fields: Partial<AuditRecord>) => {
    const current = dbOps.getAuditById(id);
    if (!current) return;

    const stmt = db.prepare(`
      UPDATE audits SET
        status = ?,
        http_code = COALESCE(?, http_code),
        response_time_ms = COALESCE(?, response_time_ms),
        ssl_valid = COALESCE(?, ssl_valid),
        title = COALESCE(?, title),
        meta_description = COALESCE(?, meta_description),
        h1_count = COALESCE(?, h1_count),
        missing_alt_images_count = COALESCE(?, missing_alt_images_count),
        robots_txt_exists = COALESCE(?, robots_txt_exists),
        sitemap_exists = COALESCE(?, sitemap_exists),
        broken_links_count = COALESCE(?, broken_links_count),
        pagespeed_scores = COALESCE(?, pagespeed_scores),
        summary = COALESCE(?, summary),
        raw_details = COALESCE(?, raw_details),
        error_message = COALESCE(?, error_message),
        finished_at = COALESCE(?, finished_at)
      WHERE id = ?
    `);

    stmt.run(
      status,
      fields.http_code ?? null,
      fields.response_time_ms ?? null,
      fields.ssl_valid ?? null,
      fields.title ?? null,
      fields.meta_description ?? null,
      fields.h1_count ?? null,
      fields.missing_alt_images_count ?? null,
      fields.robots_txt_exists ?? null,
      fields.sitemap_exists ?? null,
      fields.broken_links_count ?? null,
      fields.pagespeed_scores ?? null,
      fields.summary ?? null,
      fields.raw_details ?? null,
      fields.error_message ?? null,
      fields.finished_at ?? null,
      id
    );
  },

  getAuditById: (id: string): AuditRecord | undefined => {
    const stmt = db.prepare(`SELECT * FROM audits WHERE id = ?`);
    return stmt.get(id) as AuditRecord | undefined;
  },

  getLatestAuditForDomainAndEmail: (domain: string, email: string): AuditRecord | undefined => {
    const stmt = db.prepare(`
      SELECT a.* FROM audits a
      JOIN leads l ON a.lead_id = l.id
      WHERE LOWER(a.domain) = LOWER(?) AND LOWER(l.email) = LOWER(?)
      ORDER BY datetime(a.created_at) DESC LIMIT 1
    `);
    return stmt.get(domain, email) as AuditRecord | undefined;
  },

  getAllLeads: (limit = 100): Array<LeadRecord & { audit_count: number; latest_audit_status?: string }> => {
    const stmt = db.prepare(`
      SELECT l.*, 
        (SELECT COUNT(*) FROM audits WHERE lead_id = l.id) as audit_count,
        (SELECT status FROM audits WHERE lead_id = l.id ORDER BY datetime(created_at) DESC LIMIT 1) as latest_audit_status
      FROM leads l
      ORDER BY datetime(l.created_at) DESC
      LIMIT ?
    `);
    return stmt.all(limit) as unknown as Array<LeadRecord & { audit_count: number; latest_audit_status?: string }>;
  },

  deleteLeadAndData: (email: string): number => {
    const lead = db.prepare(`SELECT id FROM leads WHERE LOWER(email) = LOWER(?)`).get(email) as { id: string } | undefined;
    if (!lead) return 0;
    
    // Cascades to audits due to PRAGMA foreign_keys = ON
    const stmt = db.prepare(`DELETE FROM leads WHERE id = ?`);
    stmt.run(lead.id);
    return 1;
  },

  recordEvent: (eventName: string, metadata?: Record<string, unknown>) => {
    const stmt = db.prepare(`
      INSERT INTO analytics_events (event_name, metadata, created_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(eventName, metadata ? JSON.stringify(metadata) : null, new Date().toISOString());
  },

  getStats: () => {
    const totalLeads = (db.prepare(`SELECT COUNT(*) as count FROM leads`).get() as { count: number }).count;
    const consentedLeads = (db.prepare(`SELECT COUNT(*) as count FROM leads WHERE marketing_consent = 1`).get() as { count: number }).count;
    const totalAudits = (db.prepare(`SELECT COUNT(*) as count FROM audits`).get() as { count: number }).count;
    const completedAudits = (db.prepare(`SELECT COUNT(*) as count FROM audits WHERE status = 'completed'`).get() as { count: number }).count;
    const failedAudits = (db.prepare(`SELECT COUNT(*) as count FROM audits WHERE status = 'error'`).get() as { count: number }).count;

    const eventCounts = db.prepare(`
      SELECT event_name, COUNT(*) as count 
      FROM analytics_events 
      GROUP BY event_name
    `).all() as Array<{ event_name: string; count: number }>;

    return {
      totalLeads,
      consentedLeads,
      consentRate: totalLeads > 0 ? Math.round((consentedLeads / totalLeads) * 100) : 0,
      totalAudits,
      completedAudits,
      failedAudits,
      auditSuccessRate: totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0,
      events: Object.fromEntries(eventCounts.map(e => [e.event_name, e.count])),
    };
  },

  cleanupExpiredData: (retentionDays = config.dataRetentionDays) => {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const stmt = db.prepare(`DELETE FROM leads WHERE datetime(created_at) < datetime(?)`);
    stmt.run(cutoffDate);
  }
};
