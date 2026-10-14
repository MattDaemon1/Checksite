import React from 'react';
import {
  ShieldCheck,
  Zap,
  Search,
  CheckCircle2,
  ArrowRight,
  Lock,
  FileCheck,
  HelpCircle,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AppConfig } from '../types';
import { LeadCaptureForm } from './LeadCaptureForm';

interface LandingPageProps {
  onFormSubmit: (data: {
    email: string;
    websiteUrl: string;
    companyName: string;
    businessActivity: string;
    marketingConsent: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
  onOpenPrivacy: () => void;
  onOpenLegal: () => void;
  config: AppConfig | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onFormSubmit,
  isSubmitting,
  onOpenPrivacy,
  onOpenLegal,
  config,
}) => {
  const scrollToForm = () => {
    const el = document.getElementById('audit-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Outil d'audit web indépendant & sans engagement</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Votre site web est-il vraiment performant ?
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Testez gratuitement votre site et découvrez les points à améliorer pour renforcer sa performance, son référencement et son expérience utilisateur.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={scrollToForm}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>Analyser mon site gratuitement</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Reassurance pills */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-3">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Résultats immédiats
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Aucun compte requis
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Conforme RGPD
          </span>
        </div>
      </section>

      {/* Form Section */}
      <section className="px-4">
        <LeadCaptureForm
          onSubmit={onFormSubmit}
          isSubmitting={isSubmitting}
          onOpenPrivacy={onOpenPrivacy}
          onOpenLegal={onOpenLegal}
          config={config}
        />
      </section>

      {/* Main Checks Covered */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Les contrôles réalisés sur votre site
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Une analyse ciblée sur les aspects cruciaux qui influencent votre acquisition client et votre réputation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-blue-200 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Vitesse & Performance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mesure du temps de réponse initial (TTFB), poids de la page d'accueil et indicateurs d'affichage mobile et ordinateur.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 pt-1">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Temps de réaction serveur
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Évaluation Core Web Vitals
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-blue-200 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              SEO & Référencement Google
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vérification des balises fondamentales pour vous positionner auprès de vos clients locaux et sur votre secteur.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 pt-1">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Balises Title, Meta et titres H1
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Attributs alt des images & sitemap
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-blue-200 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              État Technique & Sécurité
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Contrôle du certificat SSL (cadenas vert), codes d'erreur HTTP, en-têtes de sécurité et détection de liens brisés.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 pt-1">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Certificat SSL / HTTPS valide
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Échantillonnage de liens défectueux
              </li>
            </ul>
          </div>
        </div>

        {/* Clear limitation disclaimer */}
        <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl text-center text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed">
          <HelpCircle className="w-4 h-4 text-slate-500 inline mr-1.5 -mt-0.5" />
          <strong>Transparence :</strong> Cette analyse est automatisée et fournit des indications techniques objectives. Elle ne remplace pas un audit professionnel complet ni une analyse stratégique personnalisée de vos conversions.
        </div>
      </section>

      {/* Matt Konnect Discrete Presentation */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              À propos de Matt Konnect
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Des sites web pensés pour générer des clients réels
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Matt Konnect est une agence web dédiée aux artisans, indépendants, TPE et PME. Nous concevons, refondons et maintenons des sites modernes, rapides et référencés pour faire grandir votre activité.
            </p>
          </div>

          <div className="shrink-0">
            <a
              href={config?.mattKonnectUrl || 'https://mattkonnect.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <span>Visiter le site Matt Konnect</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
