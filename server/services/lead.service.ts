import crypto from 'node:crypto';
import { dbOps, LeadRecord, AuditRecord } from '../db/index.js';
import { config } from '../config.js';
import { validateTargetUrl } from './security.service.js';

export interface CreateLeadInput {
  email: string;
  websiteUrl: string;
  companyName?: string;
  businessActivity?: string;
  marketingConsent?: boolean;
  source?: string;
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Standard RFC 5322 compatible regex check
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(trimmed) && trimmed.length <= 120;
}

export async function processLeadAndInitAudit(input: CreateLeadInput): Promise<{
  success: boolean;
  error?: string;
  leadId?: string;
  auditId?: string;
  accessToken?: string;
}> {
  // 1. Email validation
  if (!validateEmail(input.email)) {
    return { success: false, error: 'Veuillez saisir une adresse e-mail valide.' };
  }

  // 2. URL and SSRF validation
  const urlCheck = await validateTargetUrl(input.websiteUrl);
  if (!urlCheck.valid || !urlCheck.target) {
    return { success: false, error: urlCheck.error || "L'URL du site est invalide." };
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const targetUrl = urlCheck.target.rawUrl;
  const domain = urlCheck.target.normalizedDomain;

  // 3. Check for existing recent lead
  let lead = dbOps.findRecentLead(cleanEmail, targetUrl);
  const now = new Date().toISOString();

  if (!lead) {
    const leadId = crypto.randomUUID();
    lead = {
      id: leadId,
      email: cleanEmail,
      website_url: targetUrl,
      company_name: input.companyName ? input.companyName.trim().slice(0, 100) : null,
      business_activity: input.businessActivity ? input.businessActivity.trim().slice(0, 100) : null,
      marketing_consent: input.marketingConsent ? 1 : 0,
      consent_text_version: input.marketingConsent ? config.consentTextVersion : null,
      consented_at: input.marketingConsent ? now : null,
      source: input.source || 'landing_form',
      created_at: now,
    };
    dbOps.createLead(lead);

    if (input.marketingConsent) {
      dbOps.recordEvent('marketing_consent_given', { leadId: lead.id });
    }
  } else {
    // If the lead already exists and now explicitly accepted marketing consent
    if (input.marketingConsent && !lead.marketing_consent) {
      dbOps.updateLeadConsent(lead.id, 1, config.consentTextVersion, now);
      dbOps.recordEvent('marketing_consent_given', { leadId: lead.id });
    }
  }

  dbOps.recordEvent('lead_submitted', { leadId: lead.id });

  // 4. Create an audit record with an unguessable access token
  const auditId = crypto.randomUUID();
  const accessToken = crypto.randomBytes(24).toString('hex');

  const auditRecord: AuditRecord = {
    id: auditId,
    lead_id: lead.id,
    access_token: accessToken,
    url: targetUrl,
    domain,
    status: 'pending',
    created_at: now,
  };

  dbOps.createAudit(auditRecord);
  dbOps.recordEvent('audit_started', { auditId, domain });

  return {
    success: true,
    leadId: lead.id,
    auditId,
    accessToken,
  };
}
