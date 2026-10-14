import React, { useState } from 'react';
import {
  Activity,
  Search,
  Server,
  ListChecks,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Smartphone,
  Monitor,
  HelpCircle,
} from 'lucide-react';
import { AuditResponse, AppConfig } from '../types';
import { ScoreCard } from './ScoreCard';
import { RecommendationsList } from './RecommendationsList';
import { ContactCTA } from './ContactCTA';

interface AuditResultsProps {
  audit: AuditResponse;
  accessToken: string;
  config: AppConfig | null;
  onReset: () => void;
}

export const AuditResults: React.FC<AuditResultsProps> = ({
  audit,
  accessToken,
  config,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'performance' | 'seo' | 'technical' | 'recommendations'>('summary');
  const [copiedLink, setCopiedLink] = useState(false);

  const summary = audit.summary;
  const raw = audit.rawDetails;
  const pagespeed = audit.pagespeed;

  const copyPrivateLink = () => {
    const fullUrl = `${window.location.origin}/?auditId=${audit.id}&token=${accessToken}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const overallScore = summary?.overallScore ?? 50;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Rapport d'audit terminé
              </span>
              <span className="text-xs text-slate-400">
                Analysé le {new Date(audit.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{audit.domain}</span>
              <a
                href={audit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 text-sm inline-flex items-center"
                title="Ouvrir le site dans un nouvel onglet"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600">
              Diagnostic automatisé de performance, conformité SEO et état technique pour entrepreneurs et artisans.
            </p>

            {/* Share / Private link tool */}
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={copyPrivateLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copiedLink ? 'Lien privé copié !' : 'Copier le lien d\'accès privé à ce rapport'}
              </button>
            </div>
          </div>

          {/* Overall Health Score Gauge */}
          <div className="flex sm:flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-6 sm:min-w-[190px] gap-3">
            <div className="relative flex items-center justify-center">
              <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center bg-white shadow-xs ${getScoreColor(overallScore)}`}>
                <span className="text-3xl font-black leading-none">{overallScore}</span>
                <span className="text-[11px] font-bold text-slate-400 mt-0.5">/ 100</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-bold text-slate-800">Santé globale</div>
              <div className="text-[11px] text-slate-500">
                {overallScore >= 80 ? 'Site performant' : overallScore >= 50 ? 'Optimisations requises' : 'Actions prioritaires'}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Key Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <ScoreCard
            title="1. Vitesse & Performance"
            score={summary?.performanceScore}
            subtitle={`${audit.responseTimeMs || 0} ms de temps de réponse`}
            description={
              (audit.responseTimeMs || 0) < 1200
                ? "Le serveur répond rapidement, offrant une bonne réactivité initiale."
                : "Temps de réponse élevé pouvant provoquer la perte de visiteurs sur mobile."
            }
            icon={Activity}
          />

          <ScoreCard
            title="2. SEO & Référencement"
            score={summary?.seoScore}
            subtitle={`${audit.missingAltImagesCount || 0} image(s) sans alt &bull; ${audit.h1Count || 0} titre H1`}
            description={
              audit.title
                ? "Structure de page détectée et lisible par les moteurs de recherche."
                : "Balises indispensables manquantes affaiblissant votre visibilité sur Google."
            }
            icon={Search}
          />

          <ScoreCard
            title="3. État Technique & Sécurité"
            score={summary?.technicalScore}
            subtitle={audit.sslValid ? "Certificat SSL/HTTPS actif" : "Certificat non sécurisé"}
            description={
              audit.sslValid
                ? "Connexion chiffrée conforme et protocoles modernes détectés."
                : "Alerte de sécurité navigateur risquant d'effrayer vos clients."
            }
            icon={Server}
          />
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1 sm:space-x-4">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vue d'ensemble
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'performance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          1. Performance
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'seo'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          2. SEO Technique
        </button>

        <button
          onClick={() => setActiveTab('technical')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'technical'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          3. État Technique
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recommendations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          4. Recommandations ({summary?.recommendations.length || 0})
        </button>
      </div>

      {/* Tab 1: VUE D'ENSEMBLE */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-600" />
                Actions recommandées prioritaires
              </h3>
              <button
                onClick={() => setActiveTab('recommendations')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Voir tout ({summary?.recommendations.length})
              </button>
            </div>

            {summary?.recommendations && (
              <RecommendationsList
                recommendations={summary.recommendations.filter(r => r.priority === 'high' || r.priority === 'medium')}
              />
            )}
          </div>
        </div>
      )}

      {/* Tab 2: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Section 1 — Vitesse de chargement & Performance
            </h3>
            <p className="text-xs text-slate-500">
              Mesures précises du temps de réponse serveur et indicateurs Google PageSpeed Insights.
            </p>
          </div>

          {/* Server metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">Temps de réponse serveur</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{audit.responseTimeMs || 0} ms</div>
              <div className="text-xs text-slate-500 mt-1">
                {(audit.responseTimeMs || 0) < 800 ? '✅ Très réactif' : (audit.responseTimeMs || 0) < 1800 ? '⚠️ Moyen' : '❌ Trop lent (> 1.8s)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">Code HTTP</div>
              <div className="text-2xl font-black text-slate-900 mt-1">HTTP {audit.httpCode || 200}</div>
              <div className="text-xs text-slate-500 mt-1">
                {audit.httpCode === 200 ? '✅ Page d\'accueil disponible' : '⚠️ Code statut inhabituel'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase">Compression & En-têtes</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {raw?.http?.securityHeaders?.hsts ? 'HSTS Actif' : 'Standard'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Optimisation du trafic serveur
              </div>
            </div>
          </div>

          {/* PageSpeed insights section if available */}
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Google PageSpeed Insights</span>
                {pagespeed?.mobile?.available ? (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Données directes
                  </span>
                ) : (
                  <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                    Non disponible
                  </span>
                )}
              </div>
            </div>

            {pagespeed?.mobile?.available ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600" /> Score Mobile
                    </span>
                    <span className="text-lg font-black text-blue-600">
                      {pagespeed.mobile.performanceScore ?? 'N/A'}/100
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>FCP (Premier contenu) : {pagespeed.mobile.webVitals?.fcp || 'N/D'}</div>
                    <div>LCP (Plus grand élément) : {pagespeed.mobile.webVitals?.lcp || 'N/D'}</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-blue-600" /> Score Ordinateur
                    </span>
                    <span className="text-lg font-black text-blue-600">
                      {pagespeed.desktop?.performanceScore ?? 'N/A'}/100
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Performance mesurée sur environnement grand écran.
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Le module Google PageSpeed en temps réel n'a pas pu être interrogé pour cette adresse (site protégé par un pare-feu, quota dépassé ou indisponibilité momentanée). Le score de performance est estimé sur la base de la réactivité réelle mesurée par nos sondes techniques ({audit.responseTimeMs || 0} ms).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: SEO TECHNIQUE */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Section 2 — SEO Technique & Référencement
            </h3>
            <p className="text-xs text-slate-500">
              Vérification des balises fondamentales indispensables à l'indexation de votre entreprise dans Google.
            </p>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Balise Titre (&lt;title&gt;)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audit.title ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {audit.title ? `${audit.title.length} caractères` : 'Manquante'}
                </span>
              </div>
              <div className="font-semibold text-slate-900 text-sm">
                {audit.title || <span className="text-rose-600 italic">Aucune balise titre détectée</span>}
              </div>
              <p className="text-xs text-slate-500">
                La balise titre est le texte principal affiché en bleu dans les résultats Google. Idéalement entre 45 et 65 caractères.
              </p>
            </div>

            {/* Meta description */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Méta-description (&lt;meta name="description"&gt;)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audit.metaDescription ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {audit.metaDescription ? `${audit.metaDescription.length} caractères` : 'Non renseignée'}
                </span>
              </div>
              <div className="text-xs text-slate-800">
                {audit.metaDescription || <span className="text-rose-600 italic">Aucune méta-description trouvée sur la page d'accueil</span>}
              </div>
              <p className="text-xs text-slate-500">
                Donne un aperçu persuasif sous le titre dans Google pour inciter les clients potentiels à cliquer.
              </p>
            </div>

            {/* H1 Headings */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Balise Titre Principal (&lt;h1&gt;)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audit.h1Count === 1 ? 'bg-emerald-100 text-emerald-800' : audit.h1Count === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                  {audit.h1Count === 1 ? '1 unique (optimal)' : `${audit.h1Count} balise(s) H1`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chaque page doit comporter un unique titre principal &lt;h1&gt; décrivant votre coeur de métier.
              </p>
            </div>

            {/* Images & Alt */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Accessibilité des images (attributs alt)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audit.missingAltImagesCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {audit.missingAltImagesCount === 0 ? 'Toutes conformes' : `${audit.missingAltImagesCount} image(s) sans alt`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Permet aux personnes malvoyantes et aux moteurs de recherche de comprendre le contenu de vos photos et réalisations.
              </p>
            </div>

            {/* Robots & Sitemap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Fichier robots.txt</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${audit.robotsTxtExists ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {audit.robotsTxtExists ? 'Détecté' : 'Non détecté'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Plan de site sitemap.xml</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${audit.sitemapExists ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {audit.sitemapExists ? 'Détecté' : 'Non détecté'}
                </span>
              </div>
            </div>

            {/* Broken Links */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Échantillon de liens cassés
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audit.brokenLinksCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {audit.brokenLinksCount === 0 ? '0 lien cassé détecté' : `${audit.brokenLinksCount} lien(s) cassé(s)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: ÉTAT TECHNIQUE */}
      {activeTab === 'technical' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              Section 3 — État Technique & Sécurité Réseau
            </h3>
            <p className="text-xs text-slate-500">
              Diagnostic de connectivité, chiffrement TLS, redirections et conformité serveur.
            </p>
          </div>

          <div className="space-y-4">
            {/* SSL Details */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {audit.sslValid ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {audit.sslValid ? 'Certificat SSL/TLS valide et actif' : 'Certificat SSL manquant ou invalide'}
                </h4>
                <p className="text-xs text-slate-600">
                  {audit.sslValid
                    ? 'Le cadenas vert est bien affiché dans le navigateur. Les données saisies par vos visiteurs sont chiffrées.'
                    : 'Le site présente un risque d\'avertissement de sécurité majeur auprès des internautes.'}
                </p>
                {raw?.http?.sslDetails && (
                  <div className="text-[11px] text-slate-500 mt-2 font-mono">
                    Émetteur : {raw.http.sslDetails.issuer || 'Standard'} &bull; Jours restants : {raw.http.sslDetails.daysRemaining || 0}
                  </div>
                )}
              </div>
            </div>

            {/* Redirections chain */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Redirections observées
              </h4>
              {raw?.http?.redirects && raw.http.redirects.length > 0 ? (
                <div className="space-y-1 text-xs font-mono bg-white p-3 rounded-lg border border-slate-200">
                  {raw.http.redirects.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-700">
                      <span className="text-blue-600 font-bold">[{r.status}]</span>
                      <span className="truncate">{r.from}</span>
                      <span>&rarr;</span>
                      <span className="text-emerald-700 truncate">{r.to}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Aucune redirection superflue observée. Accès direct en 1 saut.
                </p>
              )}
            </div>

            {/* Security headers */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                En-têtes de protection HTTP
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>Protection HSTS (Forçage HTTPS)</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${raw?.http?.securityHeaders?.hsts ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    {raw?.http?.securityHeaders?.hsts ? 'Actif' : 'Non détecté'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span>En-tête X-Content-Type-Options</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${raw?.http?.securityHeaders?.xContentTypeOptions ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    {raw?.http?.securityHeaders?.xContentTypeOptions ? 'Conforme' : 'Non détecté'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: TOUTES LES RECOMMANDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" />
              Section 4 — Plan d'action & Recommandations prioritaires
            </h3>
            <p className="text-xs text-slate-500">
              Chaque élément est classé selon son impact commercial direct et sa priorité technique.
            </p>
          </div>

          {summary?.recommendations && (
            <RecommendationsList recommendations={summary.recommendations} />
          )}
        </div>
      )}

      {/* Conversion Section (Demander un avis sur mon site + Télécharger PDF) */}
      <ContactCTA
        auditId={audit.id}
        accessToken={accessToken}
        config={config}
      />

      {/* Legal & Educational Disclaimer */}
      <div className="text-center text-xs text-slate-400 p-4 border border-slate-200/60 rounded-2xl bg-slate-50/50 leading-relaxed max-w-3xl mx-auto">
        <strong>Information déontologique :</strong> Cette analyse est un diagnostic automatisé destiné à repérer les principales anomalies techniques de premier niveau. Elle ne remplace pas un audit de cybersécurité approfondi avec tests d'intrusion, ni un examen juridique de vos contrats ou mentions RGPD, ni une garantie de résultat sur le positionnement naturel de votre entreprise dans Google.
      </div>
    </div>
  );
};
