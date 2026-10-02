import React, { useState, useMemo } from 'react';
import { Search, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    <div className="w-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-base capitalize">{family || 'Library'}</h3>
          <span className="text-[#a0a0a0] text-xs font-mono">{filtered.length}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patterns..."
            className="h-10 pl-10 text-sm bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[#ff85e0]/40"
          />
        </div>
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompatibleOnly}
            onChange={(e) => setShowCompatibleOnly(e.target.checked)}
            className="w-4 h-4 accent-[#ff85e0] rounded"
          />
          <span className="text-xs text-[#a0a0a0]">Compatible only (≥75)</span>
        </label>
      </div>
      <div className="p-3 space-y-2">
        {filtered.map((p) => {
          const score = compatibilityScores?.[p.id] || 0;
          const isSelected = selectedIds?.includes(p.id);
          const isFrozen = p._frozen;
          return (
            <button
              key={p.id}
              onClick={() => onSelect?.(p)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-[#ff85e0]/10 border-[#ff85e0]/30 shadow-[0_0_20px_rgba(255,133,224,0.1)]'
                  : 'bg-[#1a1a1a]/60 border-white/5 hover:border-white/15 hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm font-medium truncate">{p.name}</span>
                    {isFrozen && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-white/30 text-[10px] font-mono">{p.id}</span>
                    {p.best_for?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-white/30 text-[10px]">
                        · {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {score > 0 && (
                  <div
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
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
          <div className="text-center text-white/30 text-sm py-12">No patterns found</div>
        )}
      </div>
    </div>
  );
}