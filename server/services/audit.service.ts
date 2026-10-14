import crypto from 'node:crypto';
import { dbOps, AuditRecord } from '../db/index.js';
import { validateTargetUrl } from './security.service.js';
import { safeFetchHtml, HttpResponseResult } from './http-checker.service.js';
import { analyzeHtmlAndSeo, SeoAnalysisResult } from './html-analyzer.service.js';
import { runPageSpeedAudit, CombinedPageSpeedResult } from './pagespeed.service.js';

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
  overallScore: number; // 0-100
  performanceScore: number | null; // null if PageSpeed unavailable
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

export interface FullAuditDetails {
  http: HttpResponseResult;
  seo: SeoAnalysisResult;
  pagespeed?: CombinedPageSpeedResult;
}

/**
 * Generates prioritized recommendations and calculates clean scores.
 */
export function buildAuditRecommendations(
  httpRes: HttpResponseResult,
  seoRes: SeoAnalysisResult,
  pagespeed?: CombinedPageSpeedResult
): CompleteAuditSummary {
  const recommendations: AuditRecommendation[] = [];

  // --- 1. Technical & Security Recommendations ---
  if (!httpRes.sslValid) {
    recommendations.push({
      id: 'ssl-invalid',
      category: 'security',
      priority: 'high',
      type: 'confirmed',
      title: 'Certificat SSL/HTTPS manquant ou non valide',
      impact: 'Les navigateurs signalent votre site comme "Non sécurisé", ce qui fait fuir vos clients et pénalise votre visibilité sur Google.',
      action: 'Installer et renouveler un certificat SSL valide et forcer la redirection automatique vers https://.',
    });
  }

  if (httpRes.statusCode && httpRes.statusCode >= 400) {
    recommendations.push({
      id: 'http-error',
      category: 'technical',
      priority: 'high',
      type: 'confirmed',
      title: `Erreur serveur HTTP ${httpRes.statusCode}`,
      impact: 'Votre page d\'accueil renvoie un code d\'erreur, rendant le site inaccessible ou partiellement défaillant pour les visiteurs.',
      action: 'Vérifier la configuration de votre serveur web et corriger les erreurs de routage.',
    });
  }

  if (httpRes.responseTimeMs > 2500) {
    recommendations.push({
      id: 'slow-response',
      category: 'performance',
      priority: 'high',
      type: 'confirmed',
      title: `Temps de réponse serveur élevé (${httpRes.responseTimeMs} ms)`,
      impact: 'Un temps de chargement trop long (> 2s) entraîne l\'abandon de plus de 40% des visiteurs sur mobile.',
      action: 'Optimiser l\'hébergement, activer la mise en cache serveur et vérifier les requêtes lourdes de votre CMS.',
    });
  } else if (httpRes.responseTimeMs > 1200) {
    recommendations.push({
      id: 'moderate-response',
      category: 'performance',
      priority: 'medium',
      type: 'warning',
      title: `Temps de réponse améliorable (${httpRes.responseTimeMs} ms)`,
      impact: 'Le premier affichage peut sembler lent pour des utilisateurs en connexion mobile 4G.',
      action: 'Activer la compression Gzip/Brotli et un système de cache de pages.',
    });
  }

  if (!httpRes.securityHeaders.hsts && httpRes.sslValid) {
    recommendations.push({
      id: 'hsts-missing',
      category: 'security',
      priority: 'medium',
      type: 'warning',
      title: 'En-tête de sécurité HSTS manquant',
      impact: 'Permet d\'éviter qu\'un internaute accède par mégarde à la version non chiffrée http://.',
      action: 'Ajouter l\'en-tête Strict-Transport-Security dans les réponses de votre serveur.',
    });
  }

  // --- 2. SEO Recommendations ---
  if (!seoRes.title.exists) {
    recommendations.push({
      id: 'seo-title-missing',
      category: 'seo',
      priority: 'high',
      type: 'confirmed',
      title: 'Balise <title> absente de la page d\'accueil',
      impact: 'Google ne sait pas comment intituler votre entreprise dans ses résultats, nuisant gravement à votre positionnement.',
      action: 'Ajouter un titre clair comprenant votre nom d\'entreprise, votre métier et votre zone géographique.',
    });
  } else if (seoRes.title.status === 'warning') {
    recommendations.push({
      id: 'seo-title-length',
      category: 'seo',
      priority: 'medium',
      type: 'warning',
      title: 'Titre de page perfectible',
      impact: seoRes.title.recommendation || 'Longueur sous-optimale pour l\'affichage Google.',
      action: 'Ajuster la longueur du titre pour qu\'elle soit idéalement comprise entre 45 et 60 caractères.',
    });
  }

  if (!seoRes.metaDescription.exists) {
    recommendations.push({
      id: 'seo-desc-missing',
      category: 'seo',
      priority: 'high',
      type: 'confirmed',
      title: 'Méta-description manquante',
      impact: 'Moins de clics dans Google car le résumé affiché est généré aléatoirement au lieu d\'un texte accrocheur.',
      action: 'Rédiger une méta-description persuasive de 120 à 155 caractères présentant votre offre.',
    });
  } else if (seoRes.metaDescription.status === 'warning') {
    recommendations.push({
      id: 'seo-desc-length',
      category: 'seo',
      priority: 'low',
      type: 'warning',
      title: 'Méta-description à optimiser',
      impact: seoRes.metaDescription.recommendation || 'Longueur sous-optimale.',
      action: 'Calibrer le texte entre 120 et 155 caractères pour maximiser le taux de clic.',
    });
  }

  if (seoRes.h1.status === 'error') {
    recommendations.push({
      id: 'seo-h1-missing',
      category: 'seo',
      priority: 'high',
      type: 'confirmed',
      title: 'Titre principal <h1> manquant',
      impact: 'Affaiblit la structure sémantique de la page aux yeux des moteurs de recherche et des lecteurs d\'écran.',
      action: 'Créer une balise <h1> unique résumant l\'activité principale de votre entreprise.',
    });
  } else if (seoRes.h1.status === 'warning') {
    recommendations.push({
      id: 'seo-h1-multiple',
      category: 'seo',
      priority: 'low',
      type: 'warning',
      title: 'Multiples balises <h1> détectées',
      impact: 'Dilue la hiérarchie du document.',
      action: 'Conserver une seule balise <h1> et utiliser des <h2> et <h3> pour les sous-sections.',
    });
  }

  if (seoRes.images.missingAlt > 0) {
    recommendations.push({
      id: 'seo-img-alt',
      category: 'seo',
      priority: seoRes.images.missingAlt > 5 ? 'medium' : 'low',
      type: 'confirmed',
      title: `${seoRes.images.missingAlt} image(s) sans texte alternatif (attribut alt)`,
      impact: 'Prive votre site du référencement sur Google Images et nuit à l\'accessibilité pour les personnes malvoyantes.',
      action: 'Renseigner une description concise pour chaque image illustrative de la page.',
    });
  }

  if (!seoRes.sitemapXml.exists && seoRes.sitemapXml.status === 'checked') {
    recommendations.push({
      id: 'seo-sitemap-missing',
      category: 'seo',
      priority: 'medium',
      type: 'warning',
      title: 'Plan de site sitemap.xml non détecté à la racine',
      impact: 'Ralentit l\'indexation des nouvelles pages et des modifications de votre site par Google.',
      action: 'Générer un fichier sitemap.xml et le déclarer dans Google Search Console.',
    });
  }

  if (!seoRes.robotsTxt.exists && seoRes.robotsTxt.status === 'checked') {
    recommendations.push({
      id: 'seo-robots-missing',
      category: 'seo',
      priority: 'low',
      type: 'warning',
      title: 'Fichier robots.txt absent',
      impact: 'Indique aux robots d\'exploration les répertoires à explorer ou à ignorer.',
      action: 'Créer un fichier robots.txt simple à la racine de votre hébergement.',
    });
  }

  if (seoRes.brokenLinks.brokenCount > 0) {
    recommendations.push({
      id: 'seo-broken-links',
      category: 'technical',
      priority: 'high',
      type: 'confirmed',
      title: `${seoRes.brokenLinks.brokenCount} lien(s) cassé(s) détecté(s)`,
      impact: 'Renvoie des erreurs 404 qui frustrent vos prospects et dégradent l\'image de marque de votre entreprise.',
      action: 'Corriger ou supprimer les liens morts pointant vers des pages inexistantes.',
    });
  }

  // Recommendation for manual inspection
  recommendations.push({
    id: 'manual-audit-advisory',
    category: 'technical',
    priority: 'low',
    type: 'manual_check',
    title: 'Audit de conversion & ergonomie approfondi',
    impact: 'Une analyse automatisée vérifie la technique mais ne remplace pas l\'étude de vos parcours clients réels.',
    action: 'Échanger avec un expert Matt Konnect pour tester les formulaires, devis et la navigation sur smartphone.',
  });

  // Calculate scores
  let technicalPoints = 100;
  if (!httpRes.sslValid) technicalPoints -= 35;
  if (httpRes.statusCode && httpRes.statusCode >= 400) technicalPoints -= 30;
  if (httpRes.responseTimeMs > 2000) technicalPoints -= 20;
  else if (httpRes.responseTimeMs > 1000) technicalPoints -= 10;
  if (!httpRes.securityHeaders.hsts) technicalPoints -= 10;
  if (seoRes.brokenLinks.brokenCount > 0) technicalPoints -= 15;
  const technicalScore = Math.max(10, Math.min(100, technicalPoints));

  let seoPoints = 100;
  if (!seoRes.title.exists) seoPoints -= 25;
  else if (seoRes.title.status === 'warning') seoPoints -= 10;
  if (!seoRes.metaDescription.exists) seoPoints -= 20;
  else if (seoRes.metaDescription.status === 'warning') seoPoints -= 8;
  if (seoRes.h1.status === 'error') seoPoints -= 20;
  else if (seoRes.h1.status === 'warning') seoPoints -= 8;
  if (seoRes.images.missingAlt > 0) seoPoints -= Math.min(15, seoRes.images.missingAlt * 3);
  if (!seoRes.sitemapXml.exists) seoPoints -= 10;
  if (!seoRes.robotsTxt.exists) seoPoints -= 5;
  const seoScore = Math.max(10, Math.min(100, seoPoints));

  let performanceScore: number | null = null;
  if (pagespeed?.mobile?.available && pagespeed.mobile.performanceScore != null) {
    performanceScore = pagespeed.mobile.performanceScore;
  } else {
    // Calculated score based on TTFB and payload
    let perfPoints = 95;
    if (httpRes.responseTimeMs > 3000) perfPoints = 40;
    else if (httpRes.responseTimeMs > 2000) perfPoints = 60;
    else if (httpRes.responseTimeMs > 1000) perfPoints = 78;
    else if (httpRes.responseTimeMs > 600) perfPoints = 88;
    performanceScore = perfPoints;
  }

  const overallScore = Math.round((technicalScore * 0.4) + (seoScore * 0.35) + ((performanceScore || 70) * 0.25));

  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
  const mediumPriorityCount = recommendations.filter(r => r.priority === 'medium').length;
  const lowPriorityCount = recommendations.filter(r => r.priority === 'low').length;

  return {
    overallScore,
    performanceScore,
    seoScore,
    technicalScore,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    recommendations,
    stats: {
      responseTimeMs: httpRes.responseTimeMs,
      httpCode: httpRes.statusCode || 0,
      httpsEnforced: httpRes.finalUrl.startsWith('https://'),
      sslValid: httpRes.sslValid,
      h1Count: seoRes.h1.count,
      missingAltCount: seoRes.images.missingAlt,
      brokenLinksCount: seoRes.brokenLinks.brokenCount,
      robotsTxtExists: seoRes.robotsTxt.exists,
      sitemapExists: seoRes.sitemapXml.exists,
    },
  };
}

/**
 * Creates and initiates an audit asynchronously in background or synchronously.
 */
export async function executeAudit(auditId: string): Promise<void> {
  const audit = dbOps.getAuditById(auditId);
  if (!audit) return;

  try {
    dbOps.updateAuditProgress(auditId, 'running', {});

    // 1. Fetch HTML and check HTTP/TLS
    const httpResult = await safeFetchHtml(audit.url);
    if (!httpResult.success && !httpResult.html) {
      dbOps.updateAuditProgress(auditId, 'error', {
        error_message: httpResult.errorMessage || 'Le site cible est inaccessible ou a refusé la connexion.',
        finished_at: new Date().toISOString(),
      });
      return;
    }

    // 2. Analyze HTML, SEO, images, robots.txt, sitemaps
    const seoResult = await analyzeHtmlAndSeo(httpResult.html || '', httpResult.finalUrl);

    // 3. Optional PageSpeed Insights (handled gracefully if key not set or quota exceeded)
    let pagespeedResult: CombinedPageSpeedResult | undefined;
    try {
      pagespeedResult = await runPageSpeedAudit(httpResult.finalUrl);
    } catch {
      // Continue without PageSpeed
    }

    // 4. Build summary and prioritized recommendations
    const summary = buildAuditRecommendations(httpResult, seoResult, pagespeedResult);

    const rawDetails: FullAuditDetails = {
      http: {
        ...httpResult,
        html: undefined, // Do not store megabytes of HTML in database
      },
      seo: seoResult,
      pagespeed: pagespeedResult,
    };

    // 5. Save completed audit
    dbOps.updateAuditProgress(auditId, 'completed', {
      http_code: httpResult.statusCode,
      response_time_ms: httpResult.responseTimeMs,
      ssl_valid: httpResult.sslValid ? 1 : 0,
      title: seoResult.title.content,
      meta_description: seoResult.metaDescription.content,
      h1_count: seoResult.h1.count,
      missing_alt_images_count: seoResult.images.missingAlt,
      robots_txt_exists: seoResult.robotsTxt.exists ? 1 : 0,
      sitemap_exists: seoResult.sitemapXml.exists ? 1 : 0,
      broken_links_count: seoResult.brokenLinks.brokenCount,
      pagespeed_scores: pagespeedResult ? JSON.stringify(pagespeedResult) : null,
      summary: JSON.stringify(summary),
      raw_details: JSON.stringify(rawDetails),
      finished_at: new Date().toISOString(),
    });

    dbOps.recordEvent('audit_completed', { auditId, domain: audit.domain });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    dbOps.updateAuditProgress(auditId, 'error', {
      error_message: errorMsg || "Une erreur inattendue est survenue pendant l'analyse.",
      finished_at: new Date().toISOString(),
    });
  }
}
