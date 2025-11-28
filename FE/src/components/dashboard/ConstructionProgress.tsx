'use client';

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-500',
          text: 'text-green-700',
          bgLight: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-700 border-green-200',
        };
      case 'in-progress':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-700',
          bgLight: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
        };
      default:
        return {
          bg: 'bg-gray-300',
          text: 'text-gray-600',
          bgLight: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-600 border-gray-200',
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'in-progress':
        return 'Đang thi công';
      default:
        return 'Chưa bắt đầu';
    }
  };

  const getProgressGradient = (percentage: number, status: string) => {
    if (status === 'completed') {
      return 'bg-gradient-to-r from-green-400 to-green-600';
    } else if (status === 'in-progress') {
      return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Tiến độ tổng thể</h3>
        
        {/* Progress Bar and Percentage */}
        <div className="flex items-end justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm relative"
                style={{ width: `${Math.max(progress, 1)}%` }}
              >
                {progress > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-3xl sm:text-4xl font-bold text-blue-600">{progress}%</span>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">hoàn thành</p>
          </div>
        </div>

        {/* Current Phase */}
        <div className="flex items-center gap-2 pt-3 border-t border-blue-200">
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
          <p className="text-sm sm:text-base font-medium text-gray-700">
            Giai đoạn hiện tại: <span className="text-blue-600 font-semibold">{currentPhase}</span>
          </p>
        </div>
      </div>

      {/* Phase Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
          Chi tiết các giai đoạn
        </h4>
        {phases.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500 border border-dashed border-gray-200 rounded-2xl">
            Chưa có dữ liệu giai đoạn
          </div>
        ) : (
          <div className="space-y-3">
            {phases.map((phase, index) => {
              const colors = getStatusColor(phase.status);
              return (
                <div
                  key={index}
                  className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></div>
                      <span className="text-sm sm:text-base font-semibold text-gray-900">
                        {phase.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${colors.badge}`}>
                        {getStatusText(phase.status)}
                      </span>
                      <span className="text-base font-bold text-gray-900 min-w-[3rem] text-right">
                        {phase.percentage}%
                      </span>
                    </div>
                  </div>
                  {phase.percentage > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressGradient(phase.percentage, phase.status)}`}
                        style={{ width: `${phase.percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

