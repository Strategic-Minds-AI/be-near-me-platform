import React from 'react';
import { Layers, Shield, Download, Undo, Redo, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BuilderTopBar({ project, onValidate, onExport, onUndo, onRedo, canExport }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 shrink-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
        </div>
        <span className="text-white font-bold text-sm tracking-tight">Factory</span>
        {project && (
          <>
            <span className="text-white/20">/</span>
            <span className="text-white/60 text-xs truncate max-w-24">{project.name}</span>
            <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 px-1.5 py-0">
              {project.status || 'brief'}
            </Badge>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          className="px-2 h-8 flex items-center gap-1 text-white/50 hover:text-white text-xs font-medium transition-colors"
        >
          <Undo className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Undo</span>
        </button>
        <button
          onClick={onRedo}
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-white/10 mx-0.5" />
        <button
          onClick={onValidate}
          className="px-2.5 h-8 flex items-center gap-1 text-white/60 hover:text-white text-xs font-medium transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Validate</span>
        </button>
        <Button
          size="sm"
          onClick={onExport}
          disabled={!canExport}
          className="h-8 px-3 bg-[#ff85e0] hover:bg-[#ff5cc7] text-black font-semibold text-xs rounded-lg disabled:opacity-30 disabled:bg-white/10 disabled:text-white/40"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Export
        </Button>
      </div>
    </header>
  );
}