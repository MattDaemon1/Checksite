import React from 'react';
import { Search, ExternalLink, Shield, RotateCcw } from 'lucide-react';
import { AppConfig } from '../types';

interface NavbarProps {
  config: AppConfig | null;
  onReset: () => void;
  hasActiveAudit: boolean;
  onOpenPrivacy: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onReset,
  hasActiveAudit,
  onOpenPrivacy,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onReset}>
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-slate-900 tracking-tight leading-none text-lg">
              <span>CheckSite</span>
              <span className="text-xs px-2 py-0.5 font-semibold text-blue-700 bg-blue-50 rounded-md border border-blue-200">
                by Matt Konnect
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
              Audit web indépendant pour artisans & PME
            </p>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-2 sm:gap-4">
          {hasActiveAudit && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouvelle analyse</span>
            </button>
          )}

          <a
            href={config?.mattKonnectUrl || 'https://mattkonnect.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <span>Découvrir Matt Konnect</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={config?.mattKonnectContactUrl || 'https://mattkonnect.com/#contact'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Nous contacter</span>
          </a>
        </div>
      </div>
    </header>
  );
};
