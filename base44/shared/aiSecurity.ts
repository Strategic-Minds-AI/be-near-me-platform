// Shared security helpers for AI backend functions.
// Provides prompt sanitization (prevents prompt injection) and
// simple in-memory rate limiting (per user, per function).

const MAX_PROMPT_LENGTH = 10000;

/**
 * Sanitize user input before injecting into an LLM prompt.
 * Strips code blocks, prompt-injection phrases, and role markers.
 * Truncates to MAX_PROMPT_LENGTH.
 */
export function sanitizePrompt(input: string): string {
  if (!input || typeof input !== "string") return "";
  let cleaned = input.slice(0, MAX_PROMPT_LENGTH);
  // Remove code blocks that could contain injection payloads
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  // Remove common prompt-injection phrases
  cleaned = cleaned.replace(
    /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
    ""
  );
  cleaned = cleaned.replace(/\b(system|assistant)\s*:/gi, "");
  // Remove null bytes and control chars
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.trim();
}

/**
 * Sanitize a filename — strip path traversal, keep alphanumeric + dash + dot.
 */
export function sanitizeFilename(name: string): string {
  if (!name || typeof name !== "string") return "upload";
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 200) || "upload";
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // calls per minute per user per function

/**
 * Check in-memory rate limit for a user + function pair.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 * Note: in-memory limits reset on deploy; acceptable for basic abuse prevention.
 */
export function checkRateLimit(
  userId: string,
  functionName: string
): { allowed: true } | { allowed: false; retryAfter: number } {
  const key = `${userId}:${functionName}`;
  const now = Date.now();
  let entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}