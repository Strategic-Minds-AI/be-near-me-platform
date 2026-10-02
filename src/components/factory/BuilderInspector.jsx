import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BuilderInspector({ pattern, family, isFrozen, onToggleFreeze }) {
  if (!pattern) {
    return (
      <div className="w-full p-6 text-center">
        <div className="text-white/30 text-sm">Select a pattern to inspect</div>
      </div>
    );
  }

  return (
    <div className="w-full border-t border-white/10">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-base">{pattern.name}</h3>
          <button
            onClick={onToggleFreeze}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
            title={isFrozen ? 'Unlock' : 'Freeze'}
          >
            {isFrozen ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : (
              <Unlock className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] border-white/10 text-white/50 font-mono">
            {pattern.id}
          </Badge>
          <span className="text-white/30 text-[10px] capitalize">{family}</span>
          {isFrozen && (
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
              Frozen
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {pattern.description && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Description</div>
            <p className="text-white/80 text-sm leading-relaxed">{pattern.description}</p>
          </div>
        )}

        {pattern.best_for && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Best For</div>
            <div className="flex flex-wrap gap-1.5">
              {pattern.best_for.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/70 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {pattern.layout_rule && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Layout Rule</div>
            <p className="text-white/70 text-sm leading-relaxed">{pattern.layout_rule}</p>
          </div>
        )}

        {pattern.navigation_rule && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Navigation</div>
            <p className="text-white/70 text-sm">{pattern.navigation_rule}</p>
          </div>
        )}

        {pattern.states_required && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Required States</div>
            <div className="flex flex-wrap gap-1.5">
              {pattern.states_required.map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {pattern.tags && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {pattern.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/50 border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {pattern.rules && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Rules</div>
            <ul className="space-y-1.5">
              {pattern.rules.map((rule, i) => (
                <li key={i} className="text-white/70 text-sm flex gap-2">
                  <span className="text-[#ff85e0] shrink-0">·</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pattern.guardrails && (
          <div>
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold mb-1.5 tracking-wider">Guardrails</div>
            <ul className="space-y-1.5">
              {pattern.guardrails.map((g, i) => (
                <li key={i} className="text-white/70 text-sm flex gap-2">
                  <span className="text-amber-400 shrink-0">·</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}