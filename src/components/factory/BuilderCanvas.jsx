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
    <div className="flex-1 flex flex-col bg-[#070709] min-w-0">
      {/* Viewport switcher */}
      <div className="h-10 flex items-center justify-center gap-1 border-b border-white/10 shrink-0">
        {VIEWPORTS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => onViewportChange?.(v.id)}
              className={`px-3 py-1 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                viewport === v.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {v.label}
              <span className="text-white/30 text-[10px]">{v.width}</span>
            </button>
          );
        })}
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8">
        <div
          className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: Math.min(vp.width, 1200),
            maxWidth: '100%',
            height: '70vh',
          }}
        >
          {children || (
            <div className="w-full h-full flex items-center justify-center bg-[#FAFAFA]">
              <div className="text-center">
                <div className="text-gray-300 text-sm mb-2">No project loaded</div>
                <div className="text-gray-400 text-xs">Create a project to begin composing</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}