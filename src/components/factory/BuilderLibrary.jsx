import React, { useState, useMemo } from 'react';
import { Search, Lock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function BuilderLibrary({ family, patterns, selectedIds, onSelect, compatibilityScores }) {
  const [search, setSearch] = useState('');
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!patterns) return [];
    let result = patterns;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (showCompatibleOnly && compatibilityScores) {
      result = result.filter((p) => (compatibilityScores[p.id] || 0) >= 75);
    }
    return result;
  }, [patterns, search, showCompatibleOnly, compatibilityScores]);

  return (
    <div className="w-80 flex flex-col bg-[#0D0D14] border-r border-white/10 shrink-0">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-sm capitalize">{family || 'Library'}</h3>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50">
            {filtered.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patterns..."
            className="h-8 pl-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <label className="flex items-center gap-1.5 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompatibleOnly}
            onChange={(e) => setShowCompatibleOnly(e.target.checked)}
            className="w-3.5 h-3.5 accent-pink-500"
          />
          <span className="text-xs text-white/50">Compatible only (≥75)</span>
        </label>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.map((p) => {
          const score = compatibilityScores?.[p.id] || 0;
          const isSelected = selectedIds?.includes(p.id);
          const isFrozen = p._frozen;
          return (
            <button
              key={p.id}
              onClick={() => onSelect?.(p)}
              className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-pink-500/15 border-pink-500/40'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-xs font-medium truncate">{p.name}</span>
                    {isFrozen && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-white/30 text-[10px]">{p.id}</span>
                    {p.best_for?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-white/30 text-[10px]">
                        · {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {score > 0 && (
                  <div
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      score >= 75
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {score}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-white/30 text-xs py-8">No patterns found</div>
        )}
      </div>
    </div>
  );
}