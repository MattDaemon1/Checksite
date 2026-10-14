import { Router, Request, Response } from 'express';
import { dbOps } from '../db/index.js';
import { config } from '../config.js';
import { validateEmail } from '../services/lead.service.js';

export const settingsRouter = Router();

// Public app configuration
settingsRouter.get('/config', (_req: Request, res: Response) => {
  res.json({
    brandName: config.brandName,
    serviceName: config.serviceName,
    mattKonnectUrl: config.mattKonnectUrl,
    mattKonnectContactUrl: config.mattKonnectContactUrl,
    mattKonnectRdvUrl: config.mattKonnectRdvUrl,
    contactEmail: config.contactEmail,
    consentTextVersion: config.consentTextVersion,
    consentText: config.consentText,
  });
});

// Event recording
settingsRouter.post('/events', (req: Request, res: Response) => {
  const { eventName, metadata } = req.body;
  const allowedEvents = [
    'landing_page_view',
    'form_started',
    'lead_submitted',
    'audit_started',
    'audit_completed',
    'pdf_downloaded',
    'contact_clicked',
    'marketing_consent_given',
  ];

  if (typeof eventName === 'string' && allowedEvents.includes(eventName)) {
    dbOps.recordEvent(eventName, metadata || {});
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Événement invalide.' });
  }
});

// Conversion & funnel stats
settingsRouter.get('/stats', (_req: Request, res: Response) => {
  const stats = dbOps.getStats();
  res.json(stats);
});

// GDPR: Right to erasure (droit à l'effacement)
settingsRouter.post('/gdpr/delete', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    res.status(400).json({ error: 'Adresse e-mail invalide.' });
    return;
  }

  const deletedCount = dbOps.deleteLeadAndData(email.trim().toLowerCase());
  res.json({
    success: true,
    deleted: deletedCount > 0,
    message: deletedCount > 0 
      ? 'Vos données et audits associés ont été entièrement et définitivement effacés de notre base de données.'
      : 'Aucune donnée associée à cette adresse e-mail n\'a été trouvée.',
  });
});

// Admin authentication helper
function checkAdminAuth(req: Request): boolean {
  const key = (req.headers['x-admin-key'] as string) || (req.query.admin_key as string) || (req.query.key as string);
  return Boolean(key && key === config.adminSecretKey);
}

// Verify Admin Key
settingsRouter.post('/admin/verify', (req: Request, res: Response) => {
  const { key } = req.body;
  if (key && key === config.adminSecretKey) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: 'Code administrateur incorrect.' });
  }
});

// Admin Leads Overview (Protected)
settingsRouter.get('/admin/leads', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    res.status(401).json({ error: 'Accès réservé. Clé administrateur requise.' });
    return;
  }
  const leads = dbOps.getAllLeads(100);
  res.json({
    total: leads.length,
    leads,
  });
});

// Admin CSV Export (Protected)
settingsRouter.get('/admin/leads/export.csv', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    res.status(401).send('Accès refusé. Clé administrateur manquante ou incorrecte.');
    return;
  }
  const leads = dbOps.getAllLeads(500);

  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'ID',
    'Email',
    'Site Web',
    'Entreprise',
    'Activité',
    'Consentement Marketing',
    'Version Consentement',
    'Date Consentement',
    'Date Création',
    'Nombre Audits',
    'Dernier Statut Audit',
  ];

  const rows = leads.map(l => [
    escapeCsv(l.id),
    escapeCsv(l.email),
    escapeCsv(l.website_url),
    escapeCsv(l.company_name || ''),
    escapeCsv(l.business_activity || ''),
    escapeCsv(l.marketing_consent === 1 ? 'OUI' : 'NON'),
    escapeCsv(l.consent_text_version || ''),
    escapeCsv(l.consented_at || ''),
    escapeCsv(l.created_at),
    escapeCsv(l.audit_count),
    escapeCsv(l.latest_audit_status || 'aucun'),
  ]);

  const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="checksite_prospects.csv"');
  // Add UTF-8 BOM so Excel opens it with French accents seamlessly
  res.send('\uFEFF' + csvContent);
});
