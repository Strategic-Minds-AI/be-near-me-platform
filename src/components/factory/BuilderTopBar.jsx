import React from 'react';
import { Layers, Sparkles, Shield, Download, Undo, Redo, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BuilderTopBar({ project, onValidate, onExport, onUndo, onRedo, canExport }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#0A0A0F] border-b border-white/10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Factory</span>
        </div>
        {project && (
          <>
            <span className="text-white/30">/</span>
            <span className="text-white/80 text-sm truncate max-w-48">{project.name}</span>
            <Badge variant="outline" className="text-xs border-white/20 text-white/60">
              {project.status || 'brief'}
            </Badge>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onUndo} className="text-white/60 hover:text-white">
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} className="text-white/60 hover:text-white">
          <Redo className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-white/10" />
        <Button variant="ghost" size="sm" onClick={onValidate} className="text-white/60 hover:text-white">
          <Shield className="w-4 h-4 mr-1" /> Validate
        </Button>
        <Button
          size="sm"
          onClick={onExport}
          disabled={!canExport}
          className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white"
        >
          <Download className="w-4 h-4 mr-1" /> Export
        </Button>
      </div>
    </header>
  );
}