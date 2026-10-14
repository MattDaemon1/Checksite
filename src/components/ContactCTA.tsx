import React from 'react';
import { ArrowRight, Download, Calendar, Sparkles, ShieldCheck } from 'lucide-react';
import { AppConfig } from '../types';

interface ContactCTAProps {
  auditId: string;
  accessToken: string;
  config: AppConfig | null;
  onPdfDownloaded?: () => void;
}

export const ContactCTA: React.FC<ContactCTAProps> = ({
  auditId,
  accessToken,
  config,
  onPdfDownloaded,
}) => {
  const handlePdfClick = () => {
    if (onPdfDownloaded) onPdfDownloaded();
    window.open(`/api/audits/${auditId}/pdf?token=${accessToken}`, '_blank');
  };

  const handleContactClick = () => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'contact_clicked', metadata: { auditId } }),
    }).catch(() => {});
  };

  return (
    <div className="my-10 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Accompagnement sur-mesure & Conseils d'experts
        </div>

        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
          Votre rapport révèle des points à améliorer ?
        </h3>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Matt Konnect accompagne les entreprises dans la création, la refonte, la maintenance et l'optimisation de leur site web.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          {/* Main Button */}
          <a
            href={config?.mattKonnectContactUrl || 'https://mattkonnect.com/#contact'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleContactClick}
            className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Demander un avis sur mon site</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          {/* Secondary Button */}
          <button
            type="button"
            onClick={handlePdfClick}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Télécharger mon rapport PDF</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400" />
            Échange sans engagement avec un expert
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Rapport confidentiel accessible par votre lien privé
          </span>
        </div>
      </div>
    </div>
  );
};
