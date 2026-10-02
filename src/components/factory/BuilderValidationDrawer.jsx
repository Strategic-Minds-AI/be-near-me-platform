import React from 'react';
import { CheckCircle, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BuilderValidationDrawer({ receipt, onRepair }) {
  const gates = receipt?.hard_gates || {};
  const deltas = receipt?.deltas || [];
  const result = receipt?.result || 'PENDING';

  const gateEntries = Object.entries(gates);
  const passedCount = gateEntries.filter(([, v]) => v === true || v?.passed).length;
  const failedCount = gateEntries.filter(([, v]) => v === false || v?.passed === false).length;

  return (
    <div className="h-48 bg-[#0A0A0F] border-t border-white/10 shrink-0 flex">
      {/* Result summary */}
      <div className="w-48 p-3 border-r border-white/10 flex flex-col justify-center items-center">
        {result === 'PASS' && <CheckCircle className="w-8 h-8 text-green-400 mb-1" />}
        {result === 'FAIL' && <XCircle className="w-8 h-8 text-red-400 mb-1" />}
        {result === 'BLOCKED' && <AlertCircle className="w-8 h-8 text-amber-400 mb-1" />}
        {result === 'PENDING' && <ShieldCheck className="w-8 h-8 text-white/30 mb-1" />}
        <div
          className={`text-sm font-bold ${
            result === 'PASS'
              ? 'text-green-400'
              : result === 'FAIL'
              ? 'text-red-400'
              : result === 'BLOCKED'
              ? 'text-amber-400'
              : 'text-white/40'
          }`}
        >
          {result}
        </div>
        {receipt?.repair_round !== undefined && receipt.repair_round > 0 && (
          <div className="text-white/30 text-[10px] mt-0.5">Round {receipt.repair_round}/5</div>
        )}
      </div>

      {/* Gates */}
      <div className="w-64 p-3 border-r border-white/10 overflow-y-auto">
        <div className="text-white/40 text-[10px] uppercase font-bold mb-2">
          Hard Gates ({passedCount} passed, {failedCount} failed)
        </div>
        <div className="space-y-1">
          {gateEntries.map(([gate, val]) => {
            const passed = val === true || val?.passed === true;
            return (
              <div key={gate} className="flex items-center gap-1.5">
                {passed ? (
                  <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                )}
                <span className="text-[11px] text-white/60 truncate">{gate}</span>
              </div>
            );
          })}
          {gateEntries.length === 0 && (
            <div className="text-white/30 text-xs">No validation run yet</div>
          )}
        </div>
      </div>

      {/* Deltas */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/40 text-[10px] uppercase font-bold">
            Deltas ({deltas.length})
          </div>
          {deltas.length > 0 && result !== 'PASS' && (
            <button
              onClick={onRepair}
              className="text-[10px] px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
            >
              Auto-Repair
            </button>
          )}
        </div>
        <div className="space-y-1">
          {deltas.slice(0, 20).map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span
                className={`shrink-0 font-bold ${
                  d.severity === 'error'
                    ? 'text-red-400'
                    : d.severity === 'warning'
                    ? 'text-amber-400'
                    : 'text-blue-400'
                }`}
              >
                {d.severity?.toUpperCase()}
              </span>
              <span className="text-white/60">{d.message}</span>
              {d.correction && (
                <span className="text-white/40 text-[11px]">→ {d.correction}</span>
              )}
            </div>
          ))}
          {deltas.length === 0 && (
            <div className="text-white/30 text-xs">No issues detected</div>
          )}
        </div>
      </div>
    </div>
  );
}