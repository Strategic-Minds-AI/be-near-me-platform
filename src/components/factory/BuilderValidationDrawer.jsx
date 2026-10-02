import React from 'react';
import { CheckCircle, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';

export default function BuilderValidationDrawer({ receipt, onRepair }) {
  const gates = receipt?.hard_gates || {};
  const deltas = receipt?.deltas || [];
  const result = receipt?.result || 'PENDING';

  const gateEntries = Object.entries(gates);
  const passedCount = gateEntries.filter(([, v]) => v === true || v?.passed).length;
  const failedCount = gateEntries.filter(([, v]) => v === false || v?.passed === false).length;

  const resultColor = result === 'PASS' ? 'text-green-400'
    : result === 'FAIL' ? 'text-red-400'
    : result === 'BLOCKED' ? 'text-amber-400'
    : 'text-white/50';

  const ResultIcon = result === 'PASS' ? CheckCircle
    : result === 'FAIL' ? XCircle
    : result === 'BLOCKED' ? AlertCircle
    : ShieldCheck;

  return (
    <div className="shrink-0 bg-[#262626]/60 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-stretch">
        {/* Result badge */}
        <div className="px-4 py-3 flex items-center gap-2 border-r border-white/10 shrink-0">
          <ResultIcon className={`w-5 h-5 ${resultColor}`} />
          <div>
            <div className={`text-sm font-bold ${resultColor}`}>{result}</div>
            {receipt?.repair_round !== undefined && receipt.repair_round > 0 && (
              <div className="text-white/30 text-[10px]">Round {receipt.repair_round}/5</div>
            )}
          </div>
        </div>

        {/* Hard gates */}
        <div className="flex-1 px-4 py-3 min-w-0 border-r border-white/10">
          <div className="text-[#a0a0a0] text-[10px] uppercase font-bold tracking-wider mb-1">
            Hard Gates ({passedCount} passed, {failedCount} failed)
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {gateEntries.slice(0, 6).map(([gate, val]) => {
              const passed = val === true || val?.passed === true;
              return (
                <div key={gate} className="flex items-center gap-1">
                  {passed ? (
                    <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                  )}
                  <span className="text-[11px] text-white/60 truncate max-w-20">{gate}</span>
                </div>
              );
            })}
            {gateEntries.length === 0 && (
              <div className="text-white/30 text-xs">No validation run yet</div>
            )}
          </div>
        </div>

        {/* Deltas */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[#a0a0a0] text-[10px] uppercase font-bold tracking-wider">
              Deltas ({deltas.length})
            </div>
            {deltas.length > 0 && result !== 'PASS' && (
              <button
                onClick={onRepair}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#ff85e0]/20 text-[#ff85e0] hover:bg-[#ff85e0]/30 font-medium"
              >
                Auto-Repair
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {deltas.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span
                  className={`shrink-0 font-bold text-[10px] ${
                    d.severity === 'error'
                      ? 'text-red-400'
                      : d.severity === 'warning'
                      ? 'text-amber-400'
                      : 'text-blue-400'
                  }`}
                >
                  {d.severity?.toUpperCase()}
                </span>
                <span className="text-white/60 truncate">{d.message}</span>
              </div>
            ))}
            {deltas.length === 0 && (
              <div className="text-white/30 text-xs">No issues detected</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}