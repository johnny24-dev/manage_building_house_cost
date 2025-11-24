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
        };
      case 'in-progress':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-700',
          bgLight: 'bg-blue-50',
          border: 'border-blue-200',
        };
      default:
        return {
          bg: 'bg-gray-300',
          text: 'text-gray-600',
          bgLight: 'bg-gray-50',
          border: 'border-gray-200',
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
      {/* Overall Progress - Enhanced */}
      <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Tiến độ tổng thể</h3>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-bold text-blue-600">{progress}%</span>
            <p className="text-xs text-gray-600 mt-0.5">hoàn thành</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden shadow-inner mb-3">
          <div
            className={`h-5 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg relative`}
            style={{ width: `${progress}%` }}
          >
            {progress > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <p className="text-sm font-medium text-gray-700">
            Giai đoạn hiện tại: <span className="text-blue-600 font-semibold">{currentPhase}</span>
          </p>
        </div>
      </div>

      {/* Phase Details - Enhanced */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-1">
          Chi tiết các giai đoạn
        </h4>
        {phases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Chưa có dữ liệu giai đoạn</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="space-y-3 overflow-y-auto max-h-[500px] custom-scrollbar pr-2 -mr-2">
              {phases.map((phase, index) => {
                const colors = getStatusColor(phase.status);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bgLight} hover:shadow-md transition-all duration-200 flex-shrink-0`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full ${colors.bg} shadow-sm flex-shrink-0`}
                        />
                        <span className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                          {phase.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.text} ${colors.bgLight} border ${colors.border}`}>
                          {getStatusText(phase.status)}
                        </span>
                        <span className={`text-base font-bold ${colors.text} min-w-[3rem] text-right`}>
                          {phase.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-white rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getProgressGradient(phase.percentage, phase.status)}`}
                        style={{ width: `${phase.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

