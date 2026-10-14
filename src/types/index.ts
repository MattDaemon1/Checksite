export interface LeadData {
  id: string;
  email: string;
  website_url: string;
  company_name?: string | null;
  business_activity?: string | null;
  marketing_consent: number;
  consent_text_version?: string | null;
  consented_at?: string | null;
  created_at: string;
}

export interface AuditRecommendation {
  id: string;
  category: 'performance' | 'seo' | 'technical' | 'security';
  priority: 'high' | 'medium' | 'low';
  type: 'confirmed' | 'warning' | 'manual_check';
  title: string;
  impact: string;
  action: string;
}

export interface CompleteAuditSummary {
  overallScore: number;
  performanceScore: number | null;
  seoScore: number;
  technicalScore: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  recommendations: AuditRecommendation[];
  stats: {
    responseTimeMs: number;
    httpCode: number;
    httpsEnforced: boolean;
    sslValid: boolean;
    h1Count: number;
    missingAltCount: number;
    brokenLinksCount: number;
    robotsTxtExists: boolean;
    sitemapExists: boolean;
  };
}

export interface AuditResponse {
  id: string;
  url: string;
  domain: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  httpCode?: number;
  responseTimeMs?: number;
  sslValid?: boolean;
  title?: string;
  metaDescription?: string;
  h1Count?: number;
  missingAltImagesCount?: number;
  robotsTxtExists?: boolean;
  sitemapExists?: boolean;
  brokenLinksCount?: number;
  summary?: CompleteAuditSummary | null;
  pagespeed?: {
    mobile?: {
      available: boolean;
      performanceScore?: number;
      seoScore?: number;
      accessibilityScore?: number;
      webVitals?: { fcp?: string; lcp?: string; cls?: string };
    };
    desktop?: {
      available: boolean;
      performanceScore?: number;
    };
  } | null;
  rawDetails?: {
    http?: {
      statusCode?: number;
      responseTimeMs: number;
      sslValid: boolean;
      sslDetails?: {
        issuer?: string;
        validTo?: string;
        daysRemaining?: number;
        protocol?: string;
      };
      securityHeaders: {
        hsts: boolean;
        xContentTypeOptions: boolean;
        xFrameOptions: boolean;
        csp: boolean;
      };
      redirects: Array<{ from: string; to: string; status: number }>;
    };
    seo?: {
      title: { exists: boolean; content: string; length: number; status: string; recommendation?: string };
      metaDescription: { exists: boolean; content: string; length: number; status: string; recommendation?: string };
      h1: { count: number; headings: string[]; status: string; recommendation?: string };
      images: { total: number; missingAlt: number; samplesWithoutAlt: string[] };
      mobileViewport: { exists: boolean; content: string };
      robotsTxt: { exists: boolean; status: string };
      sitemapXml: { exists: boolean; status: string };
      brokenLinks: { testedCount: number; brokenCount: number; brokenSamples: Array<{ url: string; status: number | string }> };
    };
    pagespeed?: {
      mobile: {
        available: boolean;
        performanceScore?: number;
        seoScore?: number;
        accessibilityScore?: number;
        webVitals?: { fcp?: string; lcp?: string; cls?: string };
      };
      desktop: {
        available: boolean;
        performanceScore?: number;
      };
    };
  } | null;
  errorMessage?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface AppConfig {
  brandName: string;
  serviceName: string;
  mattKonnectUrl: string;
  mattKonnectContactUrl: string;
  mattKonnectRdvUrl: string;
  contactEmail: string;
  consentTextVersion: string;
  consentText: string;
}
