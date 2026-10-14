import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuditProgress } from './components/AuditProgress';
import { AuditResults } from './components/AuditResults';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { AdminModal } from './components/AdminModal';
import { AppConfig, AuditResponse } from './types';
import { ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [view, setView] = useState<'landing' | 'progress' | 'results'>('landing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [auditId, setAuditId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeAudit, setActiveAudit] = useState<AuditResponse | null>(null);

  // Modals
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Load config & check URL params
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Failed to load config:', err));

    // Record landing page view
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'landing_page_view' }),
    }).catch(() => {});

    // Check if user arrived with direct access link (?auditId=...&token=...)
    const params = new URLSearchParams(window.location.search);
    const paramAuditId = params.get('auditId');
    const paramToken = params.get('token');

    if (paramAuditId && paramToken) {
      setAuditId(paramAuditId);
      setAccessToken(paramToken);
      fetchAudit(paramAuditId, paramToken);
    }

    if (params.get('admin') === 'true' || params.get('leads') === 'true') {
      setIsAdminOpen(true);
    }
  }, []);

  const fetchAudit = async (id: string, token: string) => {
    try {
      const res = await fetch(`/api/audits/${id}`, {
        headers: { 'x-access-token': token },
      });
      if (res.ok) {
        const data: AuditResponse = await res.json();
        setActiveAudit(data);
        if (data.status === 'completed') {
          setView('results');
        } else if (data.status === 'running' || data.status === 'pending') {
          setTargetUrl(data.url);
          setView('progress');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormSubmit = async (formData: {
    email: string;
    websiteUrl: string;
    companyName: string;
    businessActivity: string;
    marketingConsent: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsSubmitting(false);
        return { success: false, error: data.error || 'Erreur lors de la validation.' };
      }

      setAuditId(data.auditId);
      setAccessToken(data.accessToken);
      setTargetUrl(formData.websiteUrl);

      // Trigger audit start
      await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId: data.auditId,
          accessToken: data.accessToken,
        }),
      });

      setIsSubmitting(false);
      setView('progress');
      return { success: true };
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.';
      return { success: false, error: msg };
    }
  };

  const handleAuditCompleted = async () => {
    if (auditId && accessToken) {
      await fetchAudit(auditId, accessToken);
      setView('results');
    }
  };

  const handleReset = () => {
    setView('landing');
    setAuditId(null);
    setAccessToken(null);
    setActiveAudit(null);
    // Clean URL
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar
        config={config}
        onReset={handleReset}
        hasActiveAudit={view !== 'landing'}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {view === 'landing' && (
          <LandingPage
            onFormSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenLegal={() => setIsLegalOpen(true)}
            config={config}
          />
        )}

        {view === 'progress' && auditId && accessToken && (
          <AuditProgress
            auditId={auditId}
            accessToken={accessToken}
            targetUrl={targetUrl}
            onCompleted={handleAuditCompleted}
            onError={msg => console.warn('Audit warning/error:', msg)}
          />
        )}

        {view === 'results' && activeAudit && accessToken && (
          <AuditResults
            audit={activeAudit}
            accessToken={accessToken}
            config={config}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 mt-16 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">CheckSite</span>
            <span>&bull;</span>
            <span>Service proposé par <strong>Matt Konnect</strong></span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Politique de confidentialité
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsLegalOpen(true)}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Mentions légales
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Droit à l'effacement (RGPD)
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-slate-300 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              title="Accès réservé"
              aria-label="Accès réservé"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyNoticeModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        config={config}
      />

      <LegalNoticeModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        config={config}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
