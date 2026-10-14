import { Router, Request, Response } from 'express';
import { processLeadAndInitAudit } from '../services/lead.service.js';
import { rateLimiter } from '../services/security.service.js';
import { config } from '../config.js';

export const leadRouter = Router();

leadRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // Rate limiting check
  if (!rateLimiter.isAllowed(`lead:${ip}`, config.rateLimit.maxLeadRequests, config.rateLimit.windowMs)) {
    res.status(429).json({
      error: 'Trop de requêtes. Veuillez patienter quelques minutes avant de renouveler votre demande.',
    });
    return;
  }

  const { email, websiteUrl, companyName, businessActivity, marketingConsent, source } = req.body;

  if (!email || !websiteUrl) {
    res.status(400).json({
      error: "L'adresse e-mail et l'URL du site web sont obligatoires.",
    });
    return;
  }

  try {
    const result = await processLeadAndInitAudit({
      email,
      websiteUrl,
      companyName,
      businessActivity,
      marketingConsent: Boolean(marketingConsent),
      source,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      leadId: result.leadId,
      auditId: result.auditId,
      accessToken: result.accessToken,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur interne du serveur.';
    res.status(500).json({ error: errorMsg });
  }
});
