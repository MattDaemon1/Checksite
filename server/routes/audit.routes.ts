import { Router, Request, Response } from 'express';
import { dbOps } from '../db/index.js';
import { executeAudit } from '../services/audit.service.js';
import { generateAuditPdfHtml } from '../services/pdf-export.service.js';
import { rateLimiter } from '../services/security.service.js';
import { config } from '../config.js';

export const auditRouter = Router();

// Launch audit execution
auditRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  if (!rateLimiter.isAllowed(`audit:${ip}`, config.rateLimit.maxAuditRequests, config.rateLimit.windowMs)) {
    res.status(429).json({
      error: 'Limite de lancements d\'audit atteinte pour cette période. Veuillez patienter.',
    });
    return;
  }

  const { auditId, accessToken } = req.body;

  if (!auditId || !accessToken) {
    res.status(400).json({ error: 'auditId et accessToken sont requis.' });
    return;
  }

  const audit = dbOps.getAuditById(auditId);
  if (!audit) {
    res.status(404).json({ error: 'Audit introuvable.' });
    return;
  }

  // Token security check
  if (audit.access_token !== accessToken) {
    res.status(403).json({ error: 'Accès non autorisé à cet audit.' });
    return;
  }

  // If already completed or error, return immediately
  if (audit.status === 'completed' || audit.status === 'error') {
    res.json({
      id: audit.id,
      status: audit.status,
      summary: audit.summary ? JSON.parse(audit.summary) : null,
    });
    return;
  }

  // If already running, let it run and return current status
  if (audit.status === 'running') {
    res.json({ id: audit.id, status: 'running' });
    return;
  }

  // Run audit asynchronously in background and return immediate 202 Accepted
  executeAudit(auditId).catch(err => {
    console.error(`Audit ${auditId} execution error:`, err);
  });

  res.status(202).json({
    id: audit.id,
    status: 'running',
    message: 'Analyse démarrée.',
  });
});

// Fetch audit status and report
auditRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const token = (req.headers['x-access-token'] as string) || (req.query.token as string);

  const audit = dbOps.getAuditById(id);
  if (!audit) {
    res.status(404).json({ error: 'Rapport d\'audit introuvable.' });
    return;
  }

  // Enforce access token
  if (!token || audit.access_token !== token) {
    res.status(403).json({ error: 'Accès non autorisé à ce rapport.' });
    return;
  }

  const summary = audit.summary ? JSON.parse(audit.summary) : null;
  const rawDetails = audit.raw_details ? JSON.parse(audit.raw_details) : null;
  const pagespeed = audit.pagespeed_scores ? JSON.parse(audit.pagespeed_scores) : null;

  res.json({
    id: audit.id,
    url: audit.url,
    domain: audit.domain,
    status: audit.status,
    httpCode: audit.http_code,
    responseTimeMs: audit.response_time_ms,
    sslValid: Boolean(audit.ssl_valid),
    title: audit.title,
    metaDescription: audit.meta_description,
    h1Count: audit.h1_count,
    missingAltImagesCount: audit.missing_alt_images_count,
    robotsTxtExists: Boolean(audit.robots_txt_exists),
    sitemapExists: Boolean(audit.sitemap_exists),
    brokenLinksCount: audit.broken_links_count,
    summary,
    rawDetails,
    pagespeed,
    errorMessage: audit.error_message,
    createdAt: audit.created_at,
    finishedAt: audit.finished_at,
  });
});

// PDF / Printable view
auditRouter.get('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const token = (req.headers['x-access-token'] as string) || (req.query.token as string);

  const audit = dbOps.getAuditById(id);
  if (!audit) {
    res.status(404).send('Rapport introuvable.');
    return;
  }

  if (!token || audit.access_token !== token) {
    res.status(403).send('Accès non autorisé.');
    return;
  }

  const lead = dbOps.getLeadById(audit.lead_id);
  const html = generateAuditPdfHtml(audit, lead);

  dbOps.recordEvent('pdf_downloaded', { auditId: audit.id });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});
