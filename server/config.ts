import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Marketing & brand
  brandName: 'Matt Konnect',
  serviceName: 'CheckSite by Matt Konnect',
  mattKonnectUrl: process.env.MATT_KONNECT_URL || 'https://mattkonnect.com',
  mattKonnectContactUrl: process.env.MATT_KONNECT_CONTACT_URL || 'https://mattkonnect.com/#contact',
  mattKonnectRdvUrl: process.env.MATT_KONNECT_RDV_URL || 'https://mattkonnect.com/#rdv',
  contactEmail: process.env.CONTACT_EMAIL || 'contact@mattkonnect.com',

  // RGPD & Consent
  consentTextVersion: 'v1.0-2026',
  consentText: "J'accepte de recevoir par e-mail des conseils, actualités et offres de Matt Konnect. Je pourrai me désinscrire à tout moment.",
  privacyPolicyUrl: '#politique-confidentialite',
  legalMentionsUrl: '#mentions-legales',

  // Security & SSRF
  audit: {
    maxTimeoutMs: 9000,
    maxPayloadSizeBytes: 2.5 * 1024 * 1024, // 2.5MB max page download
    maxRedirects: 4,
    maxLinksSampled: 10,
    linkCheckTimeoutMs: 4000,
    allowedPorts: [80, 443],
    userAgent: 'CheckSite-AuditBot/1.0 (+https://mattkonnect.com/checksite-bot)',
  },

  // Rate Limiting (per IP / session)
  rateLimit: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxAuditRequests: 10,
    maxLeadRequests: 15,
  },

  // PageSpeed Insights API (optional)
  pageSpeedApiKey: process.env.PAGESPEED_API_KEY || '',

  // Database
  dbPath: process.env.DATABASE_PATH || './checksite.sqlite',
  dataRetentionDays: 90,
};
