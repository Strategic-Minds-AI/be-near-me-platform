import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BuilderInspector({ pattern, family, isFrozen, onToggleFreeze }) {
  if (!pattern) {
    return (
      <div className="w-80 bg-[#0D0D14] border-l border-white/10 shrink-0 p-4">
        <div className="text-white/30 text-sm text-center mt-8">
          Select a pattern to inspect
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#0D0D14] border-l border-white/10 shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold text-sm">{pattern.name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleFreeze}
            title={isFrozen ? 'Unlock' : 'Freeze'}
          >
            {isFrozen ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-white/40" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">
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
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Description</div>
            <p className="text-white/70 text-xs leading-relaxed">{pattern.description}</p>
          </div>
        )}

        {pattern.best_for && (
          <div>
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Best For</div>
            <div className="flex flex-wrap gap-1">
              {pattern.best_for.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {pattern.layout_rule && (
          <div>
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Layout Rule</div>
            <p className="text-white/70 text-xs leading-relaxed">{pattern.layout_rule}</p>
          </div>
        )}

        {pattern.navigation_rule && (
          <div>
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Navigation</div>
            <p className="text-white/70 text-xs">{pattern.navigation_rule}</p>
          </div>
        )}

        {pattern.states_required && (
          <div>
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Required States</div>
            <div className="flex flex-wrap gap-1">
              {pattern.states_required.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {pattern.tags && (
          <div>
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Tags</div>
            <div className="flex flex-wrap gap-1">
              {pattern.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {pattern.rules && (
          <div>
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Rules</div>
            <ul className="space-y-1">
              {pattern.rules.map((rule, i) => (
                <li key={i} className="text-white/60 text-xs flex gap-1.5">
                  <span className="text-pink-400">·</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pattern.guardrails && (
          <div>
            <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Guardrails</div>
            <ul className="space-y-1">
              {pattern.guardrails.map((g, i) => (
                <li key={i} className="text-white/60 text-xs flex gap-1.5">
                  <span className="text-amber-400">·</span>
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