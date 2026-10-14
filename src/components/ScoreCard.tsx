import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ScoreCardProps {
  title: string;
  score: number | null | undefined;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  isUnavailable?: boolean;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  score,
  subtitle,
  description,
  icon: Icon,
  badgeText,
  isUnavailable = false,
}) => {
  const getScoreColor = (val: number | null | undefined) => {
    if (val === null || val === undefined || isUnavailable) {
      return {
        text: 'text-slate-500',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        stroke: '#94a3b8',
        label: 'Non disponible',
      };
    }
    if (val >= 80) {
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        stroke: '#10b981',
        label: 'Bon niveau',
      };
    }
    if (val >= 50) {
      return {
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        stroke: '#f59e0b',
        label: 'À améliorer',
      };
    }
    return {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      stroke: '#ef4444',
      label: 'Prioritaire',
    };
  };

  const colors = getScoreColor(score);

  return (
    <div className={`p-5 rounded-2xl bg-white border ${colors.border} shadow-sm transition-all hover:shadow-md flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${colors.bg} ${colors.text}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
          </div>

          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {badgeText || colors.label}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1.5">
          {score !== null && score !== undefined && !isUnavailable ? (
            <>
              <span className={`text-3xl font-black ${colors.text}`}>{score}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 100</span>
            </>
          ) : (
            <span className="text-base font-bold text-slate-500">Non disponible</span>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-700">{subtitle}</p>
        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>

      {score !== null && score !== undefined && !isUnavailable && (
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(5, Math.min(100, score))}%`,
              backgroundColor: colors.stroke,
            }}
          />
        </div>
      )}
    </div>
  );
};
