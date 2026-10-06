import { base44 } from "@/api/base44Client";

/**
 * Temporary Be Near Me backend compatibility boundary.
 *
 * UI code imports this adapter instead of the Base44 client directly.
 * During convergence, provider implementations can move to Supabase/Railway
 * behind this module without changing every screen again.
 */
export const bnmData = base44;
