import React, { useState, useEffect } from 'react';
import { X, Download, Users, CheckCircle, BarChart3, RefreshCw, Lock, KeyRound, LogOut, AlertCircle, ShieldCheck } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatsData {
  totalLeads: number;
  consentedLeads: number;
  consentRate: number;
  totalAudits: number;
  completedAudits: number;
  failedAudits: number;
  auditSuccessRate: number;
  events: Record<string, number>;
}

interface LeadItem {
  id: string;
  email: string;
  website_url: string;
  company_name?: string | null;
  business_activity?: string | null;
  marketing_consent: number;
  consent_text_version?: string | null;
  consented_at?: string | null;
  created_at: string;
  audit_count: number;
  latest_audit_status?: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [adminKey, setAdminKey] = useState<string>(() => {
    return sessionStorage.getItem('checksite_admin_key') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Check existing session key on open
  useEffect(() => {
    if (isOpen) {
      const stored = sessionStorage.getItem('checksite_admin_key');
      if (stored) {
        verifyKeyAndLoad(stored);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [isOpen]);

  const verifyKeyAndLoad = async (keyToTest: string) => {
    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToTest }),
      });

      if (!res.ok) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('checksite_admin_key');
        setAuthError('Mot de passe administrateur incorrect.');
        setIsVerifying(false);
        return;
      }

      // Valid
      setAdminKey(keyToTest);
      sessionStorage.setItem('checksite_admin_key', keyToTest);
      setIsAuthenticated(true);
      fetchData(keyToTest);
    } catch {
      setAuthError('Erreur de connexion au serveur.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) return;
    verifyKeyAndLoad(inputPassword.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('checksite_admin_key');
    setAdminKey('');
    setIsAuthenticated(false);
    setInputPassword('');
    setLeads([]);
    setStats(null);
  };

  const fetchData = async (activeKey: string) => {
    setLoading(true);
    try {
      const [statsRes, leadsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/admin/leads', {
          headers: { 'x-admin-key': activeKey },
        }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      } else if (leadsRes.status === 401) {
        handleLogout();
        setAuthError('Session expirée ou clé invalide.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Espace Administration & Prospects</h3>
              <p className="text-xs text-slate-500">Accès sécurisé réservé à l'équipe Matt Konnect</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => fetchData(adminKey)}
                  disabled={loading}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <a
                  href={`/api/admin/leads/export.csv?admin_key=${encodeURIComponent(adminKey)}`}
                  download="prospects_checksite.csv"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter CSV
                </a>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-2 cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: If NOT authenticated, show password prompt */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900">Connexion Administrateur</h4>
              <p className="text-xs text-slate-500 mt-1">
                Veuillez renseigner votre mot de passe pour accéder aux adresses e-mails et exporter les prospects.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mot de passe d'accès
                </label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <span>Vérification...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Déverrouiller l'espace prospects</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-[11px] text-slate-400">
              Protégé par clé d'authentification serveur &bull; Matt Konnect
            </div>
          </div>
        ) : (
          /* Authenticated Content */
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Key Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospects Totaux</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalLeads}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Formulaires validés</div>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Accord Marketing</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">{stats.consentedLeads}</div>
                  <div className="text-[11px] text-blue-600 mt-0.5">{stats.consentRate}% de consentement</div>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Audits Réussis</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">{stats.completedAudits}</div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">{stats.auditSuccessRate}% de succès</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Téléchargements PDF</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{stats.events?.pdf_downloaded || 0}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Rapports générés</div>
                </div>
              </div>
            )}

            {/* Leads Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Liste des prospects enregistrés ({leads.length})
                </h4>
                <span className="text-xs text-slate-500">Tri par date décroissante (RGPD 90j)</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">E-mail</th>
                        <th className="px-4 py-3">Site web</th>
                        <th className="px-4 py-3">Entreprise</th>
                        <th className="px-4 py-3">Marketing</th>
                        <th className="px-4 py-3">Statut Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            Aucun prospect enregistré pour le moment.
                          </td>
                        </tr>
                      ) : (
                        leads.map(lead => (
                          <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                              {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-900 select-all">{lead.email}</td>
                            <td className="px-4 py-2.5 max-w-[180px] truncate">
                              <a
                                href={lead.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {lead.website_url.replace(/^https?:\/\//, '')}
                              </a>
                            </td>
                            <td className="px-4 py-2.5 text-slate-700">
                              {lead.company_name || <span className="text-slate-400 italic">Non précisé</span>}
                            </td>
                            <td className="px-4 py-2.5">
                              {lead.marketing_consent === 1 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                                  <CheckCircle className="w-3 h-3" /> OUI
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                                  NON
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                                  lead.latest_audit_status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : lead.latest_audit_status === 'running'
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : lead.latest_audit_status === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {lead.latest_audit_status || 'aucun'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <div>Authentification serveur requise &bull; Base SQLite locale</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
