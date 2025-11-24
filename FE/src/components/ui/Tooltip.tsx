'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom';
}

export default function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);
  const toggleTouch = (event: React.TouchEvent) => {
    event.preventDefault();
    setVisible((prev) => !prev);
  };

  const positionClasses =
    placement === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchStart={toggleTouch}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap ${positionClasses}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

