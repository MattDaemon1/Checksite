import { config } from '../config.js';

export interface PageSpeedCategoryScore {
  score: number; // 0-100
  title: string;
}

export interface CoreWebVitals {
  fcp?: string;
  lcp?: string;
  cls?: string;
  inp?: string;
}

export interface PageSpeedAnalysis {
  available: boolean;
  strategy: 'mobile' | 'desktop';
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  seoScore?: number;
  webVitals?: CoreWebVitals;
  errorMessage?: string;
}

export interface CombinedPageSpeedResult {
  mobile: PageSpeedAnalysis;
  desktop: PageSpeedAnalysis;
}

/**
 * Fetches PageSpeed Insights data for a specific strategy (mobile/desktop).
 * Securely calls Google's API server-side only.
 */
async function fetchStrategy(url: string, strategy: 'mobile' | 'desktop'): Promise<PageSpeedAnalysis> {
  try {
    const params = new URLSearchParams({
      url,
      strategy,
      category: 'PERFORMANCE',
    });
    // Add additional categories
    params.append('category', 'SEO');
    params.append('category', 'ACCESSIBILITY');
    params.append('category', 'BEST_PRACTICES');

    if (config.pageSpeedApiKey) {
      params.append('key', config.pageSpeedApiKey);
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout for PageSpeed

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        available: false,
        strategy,
        errorMessage: response.status === 429 
          ? 'Quota PageSpeed temporairement atteint.' 
          : `API PageSpeed indisponible (code ${response.status}).`,
      };
    }

    const data = await response.json();
    const lighthouse = data?.lighthouseResult;
    if (!lighthouse || !lighthouse.categories) {
      return {
        available: false,
        strategy,
        errorMessage: 'Données PageSpeed non formatées.',
      };
    }

    const categories = lighthouse.categories;
    const audits = lighthouse.audits || {};

    const perfScore = categories.performance?.score != null ? Math.round(categories.performance.score * 100) : undefined;
    const accScore = categories.accessibility?.score != null ? Math.round(categories.accessibility.score * 100) : undefined;
    const bpScore = categories['best-practices']?.score != null ? Math.round(categories['best-practices'].score * 100) : undefined;
    const seoScore = categories.seo?.score != null ? Math.round(categories.seo.score * 100) : undefined;

    const webVitals: CoreWebVitals = {
      fcp: audits['first-contentful-paint']?.displayValue,
      lcp: audits['largest-contentful-paint']?.displayValue,
      cls: audits['cumulative-layout-shift']?.displayValue,
      inp: audits['interactive']?.displayValue,
    };

    return {
      available: true,
      strategy,
      performanceScore: perfScore,
      accessibilityScore: accScore,
      bestPracticesScore: bpScore,
      seoScore,
      webVitals,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      available: false,
      strategy,
      errorMessage: errorMsg.includes('abort') 
        ? "Délai d'analyse PageSpeed dépassé." 
        : "PageSpeed Insights non disponible pour cette URL.",
    };
  }
}

/**
 * Runs PageSpeed Insights in parallel for mobile and desktop if requested.
 */
export async function runPageSpeedAudit(targetUrl: string): Promise<CombinedPageSpeedResult> {
  const [mobile, desktop] = await Promise.all([
    fetchStrategy(targetUrl, 'mobile'),
    fetchStrategy(targetUrl, 'desktop'),
  ]);

  return { mobile, desktop };
}
