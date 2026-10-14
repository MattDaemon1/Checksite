import React, { useState } from 'react';
import { Globe, Mail, Building, Briefcase, ArrowRight, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppConfig } from '../types';

interface LeadCaptureFormProps {
  onSubmit: (data: {
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

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({
  onSubmit,
  isSubmitting,
  onOpenPrivacy,
  onOpenLegal,
  config,
}) => {
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessActivity, setBusinessActivity] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false); // MUST be false by default
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    if (!hasStarted) {
      setHasStarted(true);
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'form_started' }),
      }).catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validations
    const cleanEmail = email.trim();
    const cleanUrl = websiteUrl.trim();

    if (!cleanEmail) {
      setErrorMsg('Veuillez renseigner votre adresse e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Le format de l\'adresse e-mail est invalide.');
      return;
    }

    if (!cleanUrl) {
      setErrorMsg('Veuillez renseigner l\'adresse de votre site web.');
      return;
    }

    let urlToTest = cleanUrl;
    if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
      urlToTest = `https://${urlToTest}`;
    }

    try {
      new URL(urlToTest);
    } catch {
      setErrorMsg("L'adresse du site web est invalide (ex: mon-entreprise.fr).");
      return;
    }

    const res = await onSubmit({
      email: cleanEmail,
      websiteUrl: urlToTest,
      companyName: companyName.trim(),
      businessActivity: businessActivity.trim(),
      marketingConsent,
    });

    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div id="audit-form" className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
        {/* Accent top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        <div className="mb-6 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            100% Gratuit & Sans engagement
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Lancez l'audit immédiat de votre site
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Recevez un diagnostic clair et compréhensible sans jargon technique.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Website URL (Obligatoire) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                URL de votre site web <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={websiteUrl}
                  onFocus={handleStart}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="ex: mon-entreprise-artisan.fr"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-mono text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Indiquez votre nom de domaine (avec ou sans https://).
              </p>
            </div>

            {/* Email (Obligatoire) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Votre adresse e-mail professionnelle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onFocus={handleStart}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@mon-entreprise.fr"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
                />
              </div>
            </div>

            {/* Nom Entreprise (Facultatif) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nom de l'entreprise <span className="text-slate-400 font-normal lowercase">(facultatif)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={companyName}
                  onFocus={handleStart}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="ex: Menuiserie Martin"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
                />
              </div>
            </div>

            {/* Activité (Facultatif) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Activité / Métier <span className="text-slate-400 font-normal lowercase">(facultatif)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={businessActivity}
                  onFocus={handleStart}
                  onChange={e => setBusinessActivity(e.target.value)}
                  placeholder="ex: Artisan électricien, restaurant..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* RGPD obligatoire : mention explicite de traitement */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                Votre adresse e-mail est utilisée pour vous permettre d'accéder à votre rapport et de retrouver les résultats de votre analyse. Consultez notre{' '}
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-blue-600 underline font-medium hover:text-blue-800"
                >
                  politique de confidentialité
                </button>{' '}
                pour connaître les modalités de traitement de vos données.
              </div>
            </div>

            {/* Case marketing OBLIGATOIREMENT DÉCOCHÉE PAR DÉFAUT */}
            <div className="pt-2 border-t border-slate-200/80 flex items-start gap-2.5 cursor-pointer">
              <input
                id="marketing-optin"
                type="checkbox"
                checked={marketingConsent}
                onChange={e => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
              />
              <label htmlFor="marketing-optin" className="text-xs text-slate-700 leading-snug cursor-pointer select-none">
                J'accepte de recevoir par e-mail des conseils, actualités et offres de Matt Konnect. Je pourrai me désinscrire à tout moment.
              </label>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vérification et initialisation...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Analyser mon site gratuitement
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          {/* Mention légale & pas de création de compte */}
          <div className="text-center text-[11px] text-slate-500 space-x-2">
            <span>Aucune création de compte requise</span>
            <span>&bull;</span>
            <button
              type="button"
              onClick={onOpenLegal}
              className="hover:underline text-slate-600"
            >
              Mentions légales
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:underline text-slate-600"
            >
              Vos droits RGPD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
