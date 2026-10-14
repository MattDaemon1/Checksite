import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronRight, Filter } from 'lucide-react';
import { AuditRecommendation } from '../types';

interface RecommendationsListProps {
  recommendations: AuditRecommendation[];
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({ recommendations }) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'seo' | 'technical' | 'performance'>('all');

  const filtered = recommendations.filter(item => {
    if (filter === 'high') return item.priority === 'high';
    if (filter === 'seo') return item.category === 'seo';
    if (filter === 'technical') return item.category === 'technical' || item.category === 'security';
    if (filter === 'performance') return item.category === 'performance';
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          label: 'Priorité Haute',
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          icon: AlertCircle,
        };
      case 'medium':
        return {
          label: 'Priorité Moyenne',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'Optimisation',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: Info,
        };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'confirmed':
        return { label: 'Problème confirmé', bg: 'bg-slate-100 text-slate-700' };
      case 'warning':
        return { label: 'Avertissement', bg: 'bg-amber-100 text-amber-800' };
      case 'manual_check':
        return { label: 'À vérifier manuellement', bg: 'bg-indigo-100 text-indigo-800' };
      default:
        return { label: 'Recommandation', bg: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filtrer :
        </span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Toutes ({recommendations.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'high' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          Priorité Haute ({recommendations.filter(r => r.priority === 'high').length})
        </button>
        <button
          onClick={() => setFilter('seo')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'seo' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          SEO ({recommendations.filter(r => r.category === 'seo').length})
        </button>
        <button
          onClick={() => setFilter('technical')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'technical' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Technique & Sécurité ({recommendations.filter(r => r.category === 'technical' || r.category === 'security').length})
        </button>
        <button
          onClick={() => setFilter('performance')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'performance' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          Performance ({recommendations.filter(r => r.category === 'performance').length})
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs">
            Aucune recommandation dans cette catégorie.
          </div>
        ) : (
          filtered.map(rec => {
            const badge = getPriorityBadge(rec.priority);
            const typeBadge = getTypeLabel(rec.type);
            const Icon = badge.icon;

            return (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {badge.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${typeBadge.bg}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 capitalize">
                    Section {rec.category}
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 text-base">
                  {rec.title}
                </h4>

                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800">Impact potentiel : </span>
                  {rec.impact}
                </div>

                <div className="text-xs text-blue-900 font-medium bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-950">Action recommandée : </span>
                    {rec.action}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
