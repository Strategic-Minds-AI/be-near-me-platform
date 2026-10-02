import React from "react";
import { Loader2, Inbox, WifiOff, AlertTriangle, SearchX, Lock, CheckCircle2 } from "lucide-react";

// Universal Frontend Factory — State View Components
// Implements the factory's State Patterns (S01-S16) as reusable React components.
// Every screen must declare: default, loading, empty, error, offline/slow states.
// These components ensure consistent state presentation across the app.

// ── Loading State (S02/S03) ──
export function LoadingState({ label = "Loading...", variant = "spinner" }) {
  if (variant === "skeleton") {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-white/10" />
        <div className="h-4 w-1/2 rounded bg-white/10" />
        <div className="h-32 w-full rounded-xl bg-white/5" />
        <div className="h-4 w-2/3 rounded bg-white/10" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
      <Loader2 className="w-7 h-7 animate-spin text-bnm-pink" />
      <p className="text-sm text-bnm-secondary">{label}</p>
    </div>
  );
}

// ── Empty State (S04) ──
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
        <Icon className="w-8 h-8 text-bnm-secondary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-bnm-secondary max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ── No Results State (S05) ──
export function NoResultsState({ query, action }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description={query ? `Nothing matched "${query}". Try a different search.` : "Try adjusting your filters or search terms."}
      action={action}
    />
  );
}

// ── Error State (S06/S07) ──
export function ErrorState({ title = "Something went wrong", description, onRetry, blocking = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-bnm-secondary max-w-xs">{description}</p>}
      </div>
      {onRetry && !blocking && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-full bg-bnm-pink text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ── Offline State (S08) ──
export function OfflineState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-bnm-secondary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">You're offline</h3>
        <p className="text-sm text-bnm-secondary max-w-xs">Check your connection and try again.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ── Permission Request State (S10) ──
export function PermissionState({ title, description, onAllow, onDeny }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-bnm-pink/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-bnm-pink" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-bnm-secondary max-w-xs">{description}</p>}
      </div>
      <div className="flex gap-3">
        {onDeny && (
          <button
            onClick={onDeny}
            className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Not now
          </button>
        )}
        {onAllow && (
          <button
            onClick={onAllow}
            className="px-4 py-2 rounded-full bg-bnm-pink text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Allow
          </button>
        )}
      </div>
    </div>
  );
}

// ── Success State (S11) ──
export function SuccessState({ title, description, onDone }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-400" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-bnm-secondary max-w-xs">{description}</p>}
      </div>
      {onDone && (
        <button
          onClick={onDone}
          className="px-4 py-2 rounded-full bg-bnm-pink text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      )}
    </div>
  );
}

// ── State Router ──
// Renders the appropriate state component based on a status string.
// Usage: <StateRouter status="loading" /> or <StateRouter status="empty" title="..." />
export function StateRouter({ status, ...props }) {
  switch (status) {
    case "loading":
    case "fetching":
      return <LoadingState {...props} />;
    case "skeleton":
      return <LoadingState variant="skeleton" {...props} />;
    case "empty":
      return <EmptyState {...props} />;
    case "no-results":
      return <NoResultsState {...props} />;
    case "error":
      return <ErrorState {...props} />;
    case "offline":
      return <OfflineState {...props} />;
    case "permission":
      return <PermissionState {...props} />;
    case "success":
      return <SuccessState {...props} />;
    default:
      return null;
  }
}

export default StateRouter;