import React from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

const VIEWPORTS = [
  { id: 'mobile', label: 'Mobile', width: 390, icon: Smartphone },
  { id: 'tablet', label: 'Tablet', width: 768, icon: Tablet },
  { id: 'desktop', label: 'Desktop', width: 1280, icon: Monitor },
  { id: 'wide', label: 'Wide', width: 1920, icon: Monitor },
];

export default function BuilderCanvas({ viewport, onViewportChange, children }) {
  const vp = VIEWPORTS.find((v) => v.id === viewport) || VIEWPORTS[0];

  return (
    <div className="w-full flex flex-col bg-[#0a0a0a]">
      <div className="flex items-center justify-center gap-1 p-2 border-b border-white/10 overflow-x-auto no-scrollbar">
        {VIEWPORTS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => onViewportChange?.(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                viewport === v.id
                  ? 'bg-[#ff85e0]/15 text-[#ff85e0]'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {v.label}
              <span className="text-white/30 text-[10px] font-mono">{v.width}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 flex items-start justify-center min-h-[300px]">
        <div
          className="bg-white shadow-2xl rounded-xl overflow-hidden transition-all duration-300"
          style={{
            width: Math.min(vp.width, 340),
            maxWidth: '100%',
            height: '50vh',
          }}
        >
          {children || (
            <div className="w-full h-full flex items-center justify-center bg-[#FAFAFA]">
              <div className="text-center">
                <div className="text-gray-300 text-sm mb-1">No project loaded</div>
                <div className="text-gray-400 text-xs">Create a project to begin composing</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}