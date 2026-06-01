'use client';

import { CheckCircle2, PlayCircle, Clock, Hammer, HelpCircle } from 'lucide-react';

interface ConstructionProgressProps {
  currentPhase: string;
  progress: number;
  phases: {
    name: string;
    percentage: number;
    status: 'completed' | 'in-progress' | 'pending';
  }[];
}

export default function ConstructionProgress({
  currentPhase,
  progress,
  phases,
}: ConstructionProgressProps) {
  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in zoom-in" />;
      case 'in-progress':
        return <Hammer className="w-5 h-5 text-blue-600 animate-bounce" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          cardBorder: 'border-emerald-200/60 shadow-emerald-500/5',
          cardBg: 'bg-emerald-50/20 backdrop-blur-md',
          dotBg: 'bg-emerald-500 ring-4 ring-emerald-100',
          lineColor: 'bg-emerald-500',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
          textColor: 'text-emerald-900',
          barColor: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        };
      case 'in-progress':
        return {
          cardBorder: 'border-blue-200/60 shadow-blue-500/8 bg-gradient-to-r from-white via-blue-50/5 to-white',
          cardBg: 'bg-blue-50/30 backdrop-blur-md relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-blue-500/5 before:to-transparent before:animate-shimmer',
          dotBg: 'bg-blue-600 ring-4 ring-blue-100 animate-pulse',
          lineColor: 'bg-blue-400',
          badge: 'bg-blue-50 text-blue-700 border-blue-200/50',
          textColor: 'text-blue-900 font-semibold',
          barColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        };
      default:
        return {
          cardBorder: 'border-slate-100 shadow-transparent',
          cardBg: 'bg-slate-50/10',
          dotBg: 'bg-slate-300 ring-4 ring-slate-50',
          lineColor: 'bg-slate-200',
          badge: 'bg-slate-50 text-slate-500 border-slate-200/30',
          textColor: 'text-slate-700',
          barColor: 'bg-slate-300',
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'in-progress':
        return 'Đang thực hiện';
      default:
        return 'Chờ thi công';
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Overall Progress Box */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-950 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-wide">Tiến độ tổng thể</h3>
            <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              {progress}%
            </span>
          </div>

          {/* Glowing Premium Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden shadow-inner border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative"
              style={{ width: `${Math.max(progress, 1)}%` }}
            >
              {progress > 0 && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white blur-[2px] opacity-75" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Giai đoạn hiện tại</span>
            <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {currentPhase || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Interactive Milestone Roadmap */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
          🗺️ Lộ trình các giai đoạn
        </h4>
        
        {phases.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            Chưa có dữ liệu lộ trình
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-5">
            {/* Seamless Vertical Connecting Line */}
            <div className="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-[3px] bg-slate-100 rounded-full pointer-events-none">
              {/* Dynamic glowing line indicator */}
              <div 
                className="w-full rounded-full bg-gradient-to-b from-emerald-500 via-blue-500 to-transparent transition-all duration-700"
                style={{ 
                  height: `${
                    phases.filter(p => p.status === 'completed').length * (100 / phases.length) + 
                    (phases.filter(p => p.status === 'in-progress').length > 0 ? (50 / phases.length) : 0)
                  }%` 
                }}
              />
            </div>

            {phases.map((phase, index) => {
              const styles = getStatusStyles(phase.status);
              return (
                <div
                  key={index}
                  className="relative group transition-all duration-300"
                >
                  {/* Dynamic Glowing Node Pointer */}
                  <div className={`absolute -left-[20px] sm:-left-[24px] top-4 w-4.5 h-4.5 rounded-full z-10 transition-all duration-300 flex items-center justify-center ${styles.dotBg}`} />

                  {/* Glassmorphic Roadmap Card */}
                  <div
                    className={`p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md hover:border-slate-300/80 hover:-translate-x-0.5 transition-all duration-300 ${styles.cardBorder} ${styles.cardBg}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex-shrink-0 p-1.5 bg-white border border-slate-100 rounded-lg shadow-sm">
                          {getPhaseIcon(phase.status)}
                        </span>
                        <span className={`text-sm sm:text-base font-bold tracking-tight truncate ${styles.textColor}`}>
                          {phase.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold border ${styles.badge}`}>
                          {getStatusText(phase.status)}
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-800 w-12 text-right">
                          {phase.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar inside Card if active or completed */}
                    {phase.percentage > 0 && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${styles.barColor}`}
                          style={{ width: `${phase.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

