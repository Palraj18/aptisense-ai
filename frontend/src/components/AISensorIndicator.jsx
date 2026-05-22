import React from 'react';
import { Activity } from 'lucide-react';

export const AISensorIndicator = ({ isActive, metrics }) => {
  const focus = Math.round((metrics?.cameraMetrics?.focusScore || 0) * 100);
  return (
    <div aria-hidden className="pointer-events-none fixed bottom-6 right-6 z-50">
      <div className="flex items-center gap-3 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm shadow-neuro">
        <span className={`flex h-3 w-3 items-center justify-center rounded-full ${isActive ? 'bg-neuro-cyan animate-pulse' : 'bg-gray-500'}`} />
        <div className="text-sm text-white/90">
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <Activity className="h-4 w-4 text-neuro-cyan" />
            <span className="font-medium">AI monitoring</span>
          </div>
          <div className="text-xs text-slate-300">Focus {focus}%</div>
        </div>
      </div>
    </div>
  );
};

export default AISensorIndicator;
