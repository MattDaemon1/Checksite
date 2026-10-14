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
 * Securely calls Google's API server-side only with generous timeout for real-world sites.
 */
async function fetchStrategy(url: string, strategy: 'mobile' | 'desktop'): Promise<PageSpeedAnalysis> {
  try {
    const params = new URLSearchParams({
      url,
      strategy,
      category: 'PERFORMANCE',
    });

    if (config.pageSpeedApiKey) {
      params.append('key', config.pageSpeedApiKey);
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    // Real-world sites can take up to 25-30s for Lighthouse execution
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // 35s timeout

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[PageSpeed API] HTTP ${response.status} for ${url} (${strategy}):`, errText.slice(0, 200));

      if (response.status === 429) {
        return {
          available: false,
          strategy,
          errorMessage: 'Quota PageSpeed temporairement atteint.',
        };
      }
      return {
        available: false,
        strategy,
        errorMessage: `API PageSpeed indisponible (code ${response.status}).`,
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
    console.warn(`[PageSpeed Exception] for ${url} (${strategy}):`, errorMsg);
    return {
      available: false,
      strategy,
      errorMessage: errorMsg.includes('abort') 
        ? "Délai d'analyse PageSpeed dépassé (le site met plus de 35s à répondre à Google)." 
        : "PageSpeed Insights non disponible pour cette URL.",
    };
  }
}

/**
 * Runs PageSpeed Insights. Starts with Mobile (primary), then Desktop.
 */
export async function runPageSpeedAudit(targetUrl: string): Promise<CombinedPageSpeedResult> {
  // Mobile first as requested by standard web audits
  const [mobile, desktop] = await Promise.allSettled([
    fetchStrategy(targetUrl, 'mobile'),
    fetchStrategy(targetUrl, 'desktop'),
  ]);

  const defaultUnavailable = (strategy: 'mobile' | 'desktop'): PageSpeedAnalysis => ({
    available: false,
    strategy,
    errorMessage: 'Analyse PageSpeed non disponible.',
  });

  return {
    mobile: mobile.status === 'fulfilled' ? mobile.value : defaultUnavailable('mobile'),
    desktop: desktop.status === 'fulfilled' ? desktop.value : defaultUnavailable('desktop'),
  };
}
