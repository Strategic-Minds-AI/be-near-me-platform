import React from 'react';
import {
  FolderOpen, Layers, Layout, Component, Palette,
  Type, Image, Zap, AlertCircle, Database, Download, Boxes
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'brief', label: 'Brief', icon: FolderOpen },
  { id: 'recipes', label: 'Recipes', icon: Layers },
  { id: 'pages', label: 'Pages', icon: Layout },
  { id: 'components', label: 'Components', icon: Component },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Type', icon: Type },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'motion', label: 'Motion', icon: Zap },
  { id: 'states', label: 'States', icon: AlertCircle },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'templates', label: 'Templates', icon: Boxes },
  { id: 'export', label: 'Export', icon: Download },
];

export default function BuilderLeftRail({ active, onSelect }) {
  return (
    <nav className="relative shrink-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff85e0]/30 to-transparent" />
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                isActive
                  ? 'bg-[#ff85e0]/15 text-[#ff85e0]'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}