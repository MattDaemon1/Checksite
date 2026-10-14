import React, { useState } from 'react';
import { X, ShieldCheck, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppConfig } from '../types';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AppConfig | null;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deleteMessage, setDeleteMessage] = useState('');

  if (!isOpen) return null;

  const handleErasureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteEmail.trim()) return;

    setDeleteStatus('loading');
    try {
      const res = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteStatus('success');
        setDeleteMessage(data.message || 'Données supprimées avec succès.');
        setDeleteEmail('');
      } else {
        setDeleteStatus('error');
        setDeleteMessage(data.error || 'Erreur lors de la suppression.');
      }
    } catch {
      setDeleteStatus('error');
      setDeleteMessage('Impossible de contacter le serveur.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Politique de confidentialité & Données</h3>
              <p className="text-xs text-slate-500">Conformité RGPD et transparence</p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 leading-relaxed">
          <section>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              1. Responsable de traitement
            </h4>
            <p>
              Le service <strong>CheckSite</strong> est édité par <strong>{config?.brandName || 'Matt Konnect'}</strong>. Pour toute question relative à vos données personnelles, vous pouvez contacter notre équipe à l'adresse suivante :{' '}
              <a href={`mailto:${config?.contactEmail || 'contact@mattkonnect.com'}`} className="text-blue-600 underline font-medium">
                {config?.contactEmail || 'contact@mattkonnect.com'}
              </a>.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              2. Données collectées et finalités
            </h4>
            <p className="mb-2">Nous limitons strictement la collecte aux informations nécessaires :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Adresse e-mail (obligatoire) :</strong> Utilisée pour vous associer à votre rapport d'audit et vous permettre de consulter vos résultats en toute confidentialité via un lien sécurisé.
              </li>
              <li>
                <strong>URL du site web (obligatoire) :</strong> Utilisée pour réaliser les tests techniques automatisés (vitesse, SEO, sécurité).
              </li>
              <li>
                <strong>Nom de l'entreprise et activité (facultatifs) :</strong> Utilisés pour personnaliser la restitution de votre audit.
              </li>
              <li>
                <strong>Consentement marketing (strictement optionnel) :</strong> Uniquement si vous cochez délibérément la case correspondante, nous pourrons vous adresser par e-mail des conseils d'optimisation et des offres de Matt Konnect.
              </li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              3. Durée de conservation
            </h4>
            <p>
              Les rapports d'audit et les informations associées sont conservés pour une durée maximale de <strong>90 jours</strong> après quoi ils sont purgés automatiquement. Les consentements marketing sont conservés jusqu'au retrait de votre accord.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              4. Absence de revente de données
            </h4>
            <p>
              Vos données ne sont ni vendues, ni louées, ni cédées à des tiers. Elles demeurent sous le contrôle exclusif de Matt Konnect dans le cadre de notre relation technique et commerciale.
            </p>
          </section>

          {/* Droit à l'effacement immédiat */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Exercer votre droit à l'effacement (Droit à l'oubli)
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Vous pouvez à tout instant supprimer immédiatement toutes les données vous concernant (email, entreprise, audits) sans délai d'attente :
            </p>

            <form onSubmit={handleErasureRequest} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={deleteEmail}
                onChange={e => setDeleteEmail(e.target.value)}
                placeholder="Votre adresse e-mail"
                required
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="submit"
                disabled={deleteStatus === 'loading'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                {deleteStatus === 'loading' ? 'Suppression...' : 'Supprimer mes données'}
              </button>
            </form>

            {deleteStatus === 'success' && (
              <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deleteMessage}</span>
              </div>
            )}

            {deleteStatus === 'error' && (
              <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteMessage}</span>
              </div>
            )}
          </section>
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
