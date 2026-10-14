import React from 'react';
import { X, FileText } from 'lucide-react';
import { AppConfig } from '../types';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AppConfig | null;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Mentions légales</h3>
              <p className="text-xs text-slate-500">Informations éditeur et conditions d'usage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Éditeur du service</h4>
            <p>
              Le service en ligne <strong>CheckSite by Matt Konnect</strong> est conçu et proposé par :
            </p>
            <p className="mt-1 font-medium text-slate-800">
              Matt Konnect — Agence Web & Solutions Numériques pour Professionnels<br />
              Site web officiel : <a href={config?.mattKonnectUrl || 'https://mattkonnect.com'} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{config?.mattKonnectUrl || 'https://mattkonnect.com'}</a><br />
              Contact e-mail : <a href={`mailto:${config?.contactEmail || 'contact@mattkonnect.com'}`} className="text-blue-600 underline">{config?.contactEmail || 'contact@mattkonnect.com'}</a>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">Nature de l'outil et limitation de responsabilité</h4>
            <p>
              CheckSite est un outil d'analyse automatisée préliminaire. Les indicateurs calculés (vitesse, SEO technique, sécurité TLS, détection de balises) sont fournis à titre informatif pour aider les entrepreneurs à identifier des axes d'amélioration.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cet outil ne remplace en aucun cas un audit de cybersécurité complet, une expertise juridique, ni ne garantit de positionnement spécifique sur les moteurs de recherche. Matt Konnect ne saurait être tenu responsable des conséquences de l'application ou non des recommandations formulées.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">Propriété intellectuelle</h4>
            <p>
              L'ensemble des contenus, marques, logos et éléments graphiques figurant sur ce site sont la propriété exclusive de Matt Konnect ou font l'objet d'une autorisation d'utilisation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
