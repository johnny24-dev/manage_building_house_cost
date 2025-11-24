import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string | ReactNode;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4 sm:mb-5 pb-4 border-b border-gray-200">
          {typeof title === 'string' ? (
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h3>
          ) : (
            <div className="text-lg sm:text-xl font-semibold text-gray-900">{title}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

