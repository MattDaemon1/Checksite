import * as cheerio from 'cheerio';
import { URL } from 'node:url';
import http from 'node:http';
import https from 'node:https';
import { config } from '../config.js';
import { validateTargetUrl } from './security.service.js';

export interface SeoAnalysisResult {
  title: {
    exists: boolean;
    content: string;
    length: number;
    status: 'good' | 'warning' | 'error';
    recommendation?: string;
  };
  metaDescription: {
    exists: boolean;
    content: string;
    length: number;
    status: 'good' | 'warning' | 'error';
    recommendation?: string;
  };
  h1: {
    count: number;
    headings: string[];
    status: 'good' | 'warning' | 'error';
    recommendation?: string;
  };
  images: {
    total: number;
    missingAlt: number;
    samplesWithoutAlt: string[];
    status: 'good' | 'warning';
  };
  mobileViewport: {
    exists: boolean;
    content: string;
  };
  openGraph: {
    hasTitle: boolean;
    hasDescription: boolean;
    hasImage: boolean;
  };
  canonical?: string;
  robotsTxt: {
    exists: boolean;
    status: 'checked' | 'unavailable';
  };
  sitemapXml: {
    exists: boolean;
    status: 'checked' | 'unavailable';
  };
  brokenLinks: {
    testedCount: number;
    brokenCount: number;
    brokenSamples: Array<{ url: string; status: number | string }>;
  };
}

/**
 * Quick HEAD/GET probe for auxiliary resources (robots.txt, sitemap.xml, links)
 */
async function probeUrlStatus(rawUrl: string, timeoutMs = 3500): Promise<{ ok: boolean; status: number }> {
  try {
    const validated = await validateTargetUrl(rawUrl);
    if (!validated.valid || !validated.target) {
      return { ok: false, status: 0 };
    }

    const { parsedUrl } = validated.target;
    const reqModule = parsedUrl.protocol === 'https:' ? https : http;

    return await new Promise(resolve => {
      const req = reqModule.request(
        parsedUrl,
        {
          method: 'GET',
          headers: {
            'User-Agent': config.audit.userAgent,
            'Range': 'bytes=0-1024', // Only test minimal byte response
          },
          timeout: timeoutMs,
        },
        res => {
          const status = res.statusCode || 0;
          res.resume();
          resolve({ ok: status >= 200 && status < 400, status });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, status: 408 });
      });

      req.on('error', () => {
        resolve({ ok: false, status: 0 });
      });

      req.end();
    });
  } catch {
    return { ok: false, status: 0 };
  }
}

/**
 * Analyzes HTML content and runs checks on SEO, structure, and sample links.
 */
export async function analyzeHtmlAndSeo(html: string, baseUrl: string): Promise<SeoAnalysisResult> {
  const $ = cheerio.load(html);

  // 1. Page Title
  const titleText = $('title').first().text().trim();
  const titleLength = titleText.length;
  let titleStatus: 'good' | 'warning' | 'error' = 'good';
  let titleRec: string | undefined;

  if (!titleText) {
    titleStatus = 'error';
    titleRec = "Votre page d'accueil ne possède aucune balise <title>, élément fondamental pour Google et vos visiteurs.";
  } else if (titleLength < 25) {
    titleStatus = 'warning';
    titleRec = "Le titre est court (moins de 25 caractères). Précisez votre métier et votre zone géographique.";
  } else if (titleLength > 65) {
    titleStatus = 'warning';
    titleRec = "Le titre dépasse 65 caractères et risque d'être tronqué dans les résultats de recherche.";
  }

  // 2. Meta description
  const metaDesc = $('meta[name="description" i]').attr('content')?.trim() || '';
  const descLength = metaDesc.length;
  let descStatus: 'good' | 'warning' | 'error' = 'good';
  let descRec: string | undefined;

  if (!metaDesc) {
    descStatus = 'error';
    descRec = "Aucune méta-description définie. Google affichera un extrait aléatoire dans les résultats de recherche.";
  } else if (descLength < 50) {
    descStatus = 'warning';
    descRec = "Méta-description trop courte (moins de 50 caractères). Développez votre proposition de valeur.";
  } else if (descLength > 165) {
    descStatus = 'warning';
    descRec = "Méta-description un peu longue (> 165 caractères), les moteurs de recherche risquent de la couper.";
  }

  // 3. Headings H1
  const h1Elements = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h1Count = h1Elements.length;
  let h1Status: 'good' | 'warning' | 'error' = 'good';
  let h1Rec: string | undefined;

  if (h1Count === 0) {
    h1Status = 'error';
    h1Rec = "Aucune balise <h1> détectée sur la page. Il s'agit du titre principal indispensable à la structure SEO.";
  } else if (h1Count > 1) {
    h1Status = 'warning';
    h1Rec = `Plusieurs balises <h1> (${h1Count}) ont été trouvées. La bonne pratique SEO recommande une seule balise <h1> principale par page.`;
  }

  // 4. Images & Alt attributes
  const imgElements = $('img');
  let missingAlt = 0;
  const samplesWithoutAlt: string[] = [];

  imgElements.each((_, el) => {
    const alt = $(el).attr('alt');
    const src = $(el).attr('src') || '';
    if (alt === undefined || alt === null || alt.trim() === '') {
      missingAlt++;
      if (samplesWithoutAlt.length < 5 && src) {
        samplesWithoutAlt.push(src.slice(0, 100));
      }
    }
  });

  // 5. Mobile Viewport & Social Meta
  const viewportContent = $('meta[name="viewport" i]').attr('content')?.trim() || '';
  const ogTitle = !!$('meta[property="og:title" i], meta[name="og:title" i]').attr('content');
  const ogDescription = !!$('meta[property="og:description" i], meta[name="og:description" i]').attr('content');
  const ogImage = !!$('meta[property="og:image" i], meta[name="og:image" i]').attr('content');
  const canonical = $('link[rel="canonical" i]').attr('href')?.trim();

  // 6. Robots.txt and Sitemap.xml verification (parallel probe)
  let robotsTxtResult: { exists: boolean; status: 'checked' | 'unavailable' } = { exists: false, status: 'unavailable' };
  let sitemapXmlResult: { exists: boolean; status: 'checked' | 'unavailable' } = { exists: false, status: 'unavailable' };

  try {
    const parsedBase = new URL(baseUrl);
    const robotsUrl = `${parsedBase.origin}/robots.txt`;
    const sitemapUrl = `${parsedBase.origin}/sitemap.xml`;

    const [robotsProbe, sitemapProbe] = await Promise.all([
      probeUrlStatus(robotsUrl),
      probeUrlStatus(sitemapUrl),
    ]);

    robotsTxtResult = {
      exists: robotsProbe.ok,
      status: 'checked',
    };
    sitemapXmlResult = {
      exists: sitemapProbe.ok,
      status: 'checked',
    };
  } catch {
    // Keep default unavailable status
  }

  // 7. Broken links sample (test up to 10 unique links)
  const linksToTest = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }
    try {
      const fullLink = new URL(href, baseUrl).toString();
      if (linksToTest.size < config.audit.maxLinksSampled) {
        linksToTest.add(fullLink);
      }
    } catch {
      // ignore invalid link
    }
  });

  const brokenSamples: Array<{ url: string; status: number | string }> = [];
  let brokenCount = 0;

  if (linksToTest.size > 0) {
    const linkArray = Array.from(linksToTest);
    const testPromises = linkArray.map(async link => {
      const res = await probeUrlStatus(link, config.audit.linkCheckTimeoutMs);
      if (!res.ok && res.status >= 400) {
        return { url: link, status: res.status };
      }
      return null;
    });

    const results = await Promise.all(testPromises);
    for (const r of results) {
      if (r) {
        brokenCount++;
        brokenSamples.push(r);
      }
    }
  }

  return {
    title: {
      exists: !!titleText,
      content: titleText,
      length: titleLength,
      status: titleStatus,
      recommendation: titleRec,
    },
    metaDescription: {
      exists: !!metaDesc,
      content: metaDesc,
      length: descLength,
      status: descStatus,
      recommendation: descRec,
    },
    h1: {
      count: h1Count,
      headings: h1Elements.slice(0, 3),
      status: h1Status,
      recommendation: h1Rec,
    },
    images: {
      total: imgElements.length,
      missingAlt,
      samplesWithoutAlt,
      status: missingAlt > 0 ? 'warning' : 'good',
    },
    mobileViewport: {
      exists: !!viewportContent,
      content: viewportContent,
    },
    openGraph: {
      hasTitle: ogTitle,
      hasDescription: ogDescription,
      hasImage: ogImage,
    },
    canonical,
    robotsTxt: robotsTxtResult,
    sitemapXml: sitemapXmlResult,
    brokenLinks: {
      testedCount: linksToTest.size,
      brokenCount,
      brokenSamples,
    },
  };
}
