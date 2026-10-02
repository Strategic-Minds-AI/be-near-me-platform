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
    <nav className="w-16 flex flex-col items-center gap-1 py-3 bg-[#0D0D14] border-r border-white/10 shrink-0">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive
                ? 'bg-pink-500/20 text-pink-400'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
            title={item.label}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}