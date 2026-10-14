import { AuditRecord, LeadRecord } from '../db/index.js';
import { CompleteAuditSummary, FullAuditDetails } from './audit.service.js';
import { config } from '../config.js';

/**
 * Generates an optimized, beautifully styled printable HTML document for PDF generation and printing.
 */
export function generateAuditPdfHtml(
  audit: AuditRecord,
  lead?: LeadRecord
): string {
  const summary: CompleteAuditSummary = audit.summary ? JSON.parse(audit.summary) : null;
  const rawDetails: FullAuditDetails = audit.raw_details ? JSON.parse(audit.raw_details) : null;
  const formattedDate = new Date(audit.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16a34a'; // green
    if (score >= 50) return '#d97706'; // amber
    return '#dc2626'; // red
  };

  const overallScore = summary?.overallScore ?? 50;
  const scoreColor = getScoreColor(overallScore);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport d'Audit Web — ${audit.domain} — CheckSite by Matt Konnect</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      background: #ffffff;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    .brand span {
      color: #2563eb;
    }
    .meta {
      font-size: 12px;
      color: #64748b;
      text-align: right;
    }
    .hero {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .target-info h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .target-url {
      font-size: 14px;
      color: #2563eb;
      word-break: break-all;
    }
    .score-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 4px solid ${scoreColor};
      color: ${scoreColor};
      font-size: 28px;
      font-weight: 800;
      background: #ffffff;
    }
    .score-badge small {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-top: -4px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
    }
    .metric-title {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 6px;
    }
    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    .metric-desc {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
      margin: 24px 0 14px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .tag-high { background: #fee2e2; color: #991b1b; }
    .tag-med { background: #fef3c7; color: #92400e; }
    .tag-low { background: #e0f2fe; color: #075985; }
    .tag-confirmed { background: #f1f5f9; color: #334155; }
    .rec-item {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .rec-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .rec-title {
      font-weight: 700;
      font-size: 14px;
      color: #0f172a;
    }
    .rec-impact {
      font-size: 12px;
      color: #475569;
      margin-bottom: 6px;
    }
    .rec-action {
      font-size: 12px;
      color: #1e3a8a;
      background: #eff6ff;
      padding: 8px 10px;
      border-radius: 4px;
      border-left: 3px solid #2563eb;
    }
    .cta-box {
      background: #0f172a;
      color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      text-align: center;
      page-break-inside: avoid;
    }
    .cta-box h3 {
      font-size: 17px;
      margin-bottom: 6px;
    }
    .cta-box p {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 14px;
    }
    .cta-box a {
      display: inline-block;
      background: #2563eb;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
    }
    .disclaimer {
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      margin-top: 24px;
      line-height: 1.4;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
      Imprimer / Enregistrer en PDF
    </button>
  </div>

  <div class="header">
    <div class="brand">CheckSite <span>by Matt Konnect</span></div>
    <div class="meta">
      <div>Audit Web Automatisé</div>
      <div>Généré le ${formattedDate}</div>
      ${lead?.company_name ? `<div>Entreprise : ${lead.company_name}</div>` : ''}
    </div>
  </div>

  <div class="hero">
    <div class="target-info">
      <h1>Rapport d'audit de site web</h1>
      <div class="target-url">${audit.url}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
        Statut du serveur : HTTP ${audit.http_code || 'OK'} &bull; Temps de réponse : ${audit.response_time_ms || 0} ms
      </div>
    </div>
    <div class="score-badge">
      ${overallScore}
      <small>/ 100</small>
    </div>
  </div>

  <div class="grid">
    <div class="metric-card">
      <div class="metric-title">Performance & Réactivité</div>
      <div class="metric-value" style="color: ${getScoreColor(summary?.performanceScore ?? 70)}">
        ${summary?.performanceScore != null ? `${summary.performanceScore} / 100` : `${audit.response_time_ms} ms`}
      </div>
      <div class="metric-desc">
        ${summary?.performanceScore != null ? 'Mesure PageSpeed / TTFB' : 'Temps de réponse du serveur'}
      </div>
    </div>
    <div class="metric-card">
      <div class="metric-title">SEO Technique</div>
      <div class="metric-value" style="color: ${getScoreColor(summary?.seoScore ?? 70)}">
        ${summary?.seoScore ?? 0} / 100
      </div>
      <div class="metric-desc">
        ${audit.missing_alt_images_count || 0} image(s) sans alt &bull; ${audit.h1_count || 0} balise H1
      </div>
    </div>
    <div class="metric-card">
      <div class="metric-title">État Technique & Sécurité</div>
      <div class="metric-value" style="color: ${getScoreColor(summary?.technicalScore ?? 70)}">
        ${summary?.technicalScore ?? 0} / 100
      </div>
      <div class="metric-desc">
        ${audit.ssl_valid ? 'Certificat SSL valide' : 'SSL Manquant / Invalide'} &bull; ${audit.broken_links_count || 0} lien cassé
      </div>
    </div>
  </div>

  <h2 class="section-title">Contrôles techniques détaillés</h2>
  <table>
    <thead>
      <tr>
        <th>Élément vérifié</th>
        <th>Valeur observée</th>
        <th>État</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Sécurité HTTPS & SSL</td>
        <td>${audit.ssl_valid ? 'Certificat TLS actif et reconnu' : 'Certificat manquant ou invalide'}</td>
        <td><span class="tag ${audit.ssl_valid ? 'tag-med' : 'tag-high'}">${audit.ssl_valid ? 'Conforme' : 'Critique'}</span></td>
      </tr>
      <tr>
        <td>Temps de réponse</td>
        <td>${audit.response_time_ms || 0} ms</td>
        <td><span class="tag ${(audit.response_time_ms || 0) < 1500 ? 'tag-med' : 'tag-high'}">${(audit.response_time_ms || 0) < 1500 ? 'Normal' : 'Lent'}</span></td>
      </tr>
      <tr>
        <td>Balise Titre (&lt;title&gt;)</td>
        <td>${audit.title ? `${audit.title} (${audit.title.length} car.)` : 'Absente'}</td>
        <td><span class="tag ${audit.title ? 'tag-med' : 'tag-high'}">${audit.title ? 'Présent' : 'À corriger'}</span></td>
      </tr>
      <tr>
        <td>Méta-description</td>
        <td>${audit.meta_description ? `${audit.meta_description.slice(0, 70)}... (${audit.meta_description.length} car.)` : 'Non renseignée'}</td>
        <td><span class="tag ${audit.meta_description ? 'tag-med' : 'tag-high'}">${audit.meta_description ? 'Présente' : 'Manquante'}</span></td>
      </tr>
      <tr>
        <td>Balise H1 principale</td>
        <td>${audit.h1_count === 1 ? '1 balise H1 unique (optimal)' : `${audit.h1_count} balise(s) H1 trouvée(s)`}</td>
        <td><span class="tag ${audit.h1_count === 1 ? 'tag-med' : 'tag-high'}">${audit.h1_count === 1 ? 'Optimal' : 'À vérifier'}</span></td>
      </tr>
      <tr>
        <td>Accessibilité des images</td>
        <td>${audit.missing_alt_images_count === 0 ? 'Toutes les images ont un attribut alt' : `${audit.missing_alt_images_count} image(s) sans balise alt`}</td>
        <td><span class="tag ${audit.missing_alt_images_count === 0 ? 'tag-med' : 'tag-high'}">${audit.missing_alt_images_count === 0 ? 'Parfait' : 'Optimisable'}</span></td>
      </tr>
      <tr>
        <td>Fichiers d'indexation</td>
        <td>robots.txt : ${audit.robots_txt_exists ? 'Détecté' : 'Non trouvé'} &bull; sitemap.xml : ${audit.sitemap_exists ? 'Détecté' : 'Non trouvé'}</td>
        <td><span class="tag tag-med">Standard</span></td>
      </tr>
      <tr>
        <td>Échantillon de liens</td>
        <td>${audit.broken_links_count === 0 ? 'Aucun lien mort sur l\'échantillon testé' : `${audit.broken_links_count} lien(s) défectueux`}</td>
        <td><span class="tag ${audit.broken_links_count === 0 ? 'tag-med' : 'tag-high'}">${audit.broken_links_count === 0 ? 'OK' : 'À corriger'}</span></td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-title">Recommandations priorisées</h2>
  ${summary?.recommendations?.map(rec => `
    <div class="rec-item">
      <div class="rec-header">
        <span class="rec-title">${rec.title}</span>
        <div>
          <span class="tag tag-${rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'med' : 'low'}">
            Priorité ${rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
          </span>
          <span class="tag tag-confirmed">
            ${rec.type === 'confirmed' ? 'Confirmé' : rec.type === 'warning' ? 'Avertissement' : 'À vérifier'}
          </span>
        </div>
      </div>
      <div class="rec-impact"><strong>Impact :</strong> ${rec.impact}</div>
      <div class="rec-action"><strong>Action recommandée :</strong> ${rec.action}</div>
    </div>
  `).join('') || '<p>Aucune recommandation enregistrée.</p>'}

  <div class="cta-box">
    <h3>Votre rapport révèle des points à améliorer ?</h3>
    <p>Matt Konnect accompagne les artisans et les TPE/PME dans la refonte, la création, la maintenance et l'optimisation de leur site web.</p>
    <a href="${config.mattKonnectContactUrl}" target="_blank" rel="noopener noreferrer">Demander un avis sur mon site avec Matt Konnect</a>
  </div>

  <div class="disclaimer">
    Avertissement : Ce diagnostic automatisé est fourni à titre indicatif pour identifier rapidement les pistes d'amélioration technique. Il ne constitue ni un audit exhaustif de cybersécurité, ni un audit juridique de conformité RGPD, ni une garantie de positionnement dans les moteurs de recherche. CheckSite by Matt Konnect.
  </div>
</body>
</html>`;
}
