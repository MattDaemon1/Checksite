import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface AuditProgressProps {
  auditId: string;
  accessToken: string;
  targetUrl: string;
  onCompleted: () => void;
  onError: (msg: string) => void;
}

const AUDIT_STEPS = [
  { id: 1, label: 'Validation de sécurité réseau & protection anti-SSRF' },
  { id: 2, label: 'Résolution DNS & test de connexion HTTP / HTTPS' },
  { id: 3, label: 'Contrôle du certificat TLS/SSL et temps de réponse' },
  { id: 4, label: 'Analyse du balisage HTML (Title, Meta-description, H1)' },
  { id: 5, label: 'Examen de l\'accessibilité des images (attributs alt)' },
  { id: 6, label: 'Exploration des fichiers robots.txt et sitemap.xml' },
  { id: 7, label: 'Test d\'un échantillon de liens & calcul des recommandations' },
];

export const AuditProgress: React.FC<AuditProgressProps> = ({
  auditId,
  accessToken,
  targetUrl,
  onCompleted,
  onError,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Progressive simulated timer reflecting the real background execution
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < AUDIT_STEPS.length ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(stepInterval);
  }, []);

  // Poll server for actual audit status
  useEffect(() => {
    let isCancelled = false;
    let pollCount = 0;
    const maxPolls = 35; // 35 * 1000ms = 35 seconds max wait

    const poll = async () => {
      if (isCancelled) return;
      pollCount++;

      try {
        const res = await fetch(`/api/audits/${auditId}`, {
          headers: {
            'x-access-token': accessToken,
          },
        });

        if (!res.ok) {
          if (res.status === 403) {
            setErrorMessage('Accès non autorisé à cet audit.');
            onError('Accès non autorisé à cet audit.');
            return;
          }
          if (pollCount > maxPolls) {
            setErrorMessage("L'analyse a pris trop de temps à répondre.");
            onError("L'analyse a pris trop de temps à répondre.");
            return;
          }
          setTimeout(poll, 1200);
          return;
        }

        const data = await res.json();

        if (data.status === 'completed') {
          setCurrentStep(AUDIT_STEPS.length);
          setTimeout(() => {
            if (!isCancelled) onCompleted();
          }, 600);
          return;
        }

        if (data.status === 'error') {
          const err = data.errorMessage || "Une erreur est survenue lors de l'analyse du site web.";
          setErrorMessage(err);
          onError(err);
          return;
        }

        if (pollCount >= maxPolls) {
          const timeoutErr = "Délai d'analyse dépassé. Le site met trop de temps à répondre.";
          setErrorMessage(timeoutErr);
          onError(timeoutErr);
          return;
        }

        setTimeout(poll, 1200);
      } catch (err: unknown) {
        if (pollCount >= maxPolls) {
          const e = err instanceof Error ? err.message : 'Erreur de connexion.';
          setErrorMessage(e);
          onError(e);
        } else {
          setTimeout(poll, 1200);
        }
      }
    };

    poll();

    return () => {
      isCancelled = true;
    };
  }, [auditId, accessToken, onCompleted, onError]);

  const handleRetry = async () => {
    setErrorMessage(null);
    setCurrentStep(1);
    try {
      await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, accessToken }),
      });
    } catch {
      // Handled in polling
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-8">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3 shadow-inner">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Analyse de votre site en direct
          </h2>
          <p className="text-sm font-mono text-blue-600 mt-1 truncate max-w-md mx-auto">
            {targetUrl}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Les contrôles techniques sont en cours d'exécution sur votre serveur...
          </p>
        </div>

        {errorMessage ? (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Impossible de terminer l'analyse</p>
                <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
              </div>
            </div>

            <button
              onClick={handleRetry}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer l'analyse sans ressaisir vos coordonnées
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {AUDIT_STEPS.map(step => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-50/70 text-slate-800'
                      : isCurrent
                      ? 'bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-200'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <span className="flex-1">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            Contrôles réels sans données inventées
          </span>
          <span>CheckSite</span>
        </div>
      </div>
    </div>
  );
};
