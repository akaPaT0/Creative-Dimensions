type AttemptRecord = {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil: number | null;
};

// In-memory sliding window store
const attemptsStore = new Map<string, AttemptRecord>();

// Clean up stale records periodically (every 10 minutes)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleRecords() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of attemptsStore.entries()) {
    // Evict if lock has expired and no attempts in the last 30 minutes
    const isLockExpired = !record.lockedUntil || record.lockedUntil < now;
    const isInactive = now - record.lastAttemptAt > 30 * 60 * 1000;
    if (isLockExpired && isInactive) {
      attemptsStore.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
};

/**
 * Checks whether an attempt from this identifier is allowed.
 * Tier 1: 5 failed attempts -> 5-minute lockout (300s)
 * Tier 2: 10 failed attempts -> 30-minute lockout (1800s)
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  cleanupStaleRecords();
  const now = Date.now();
  const record = attemptsStore.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: 5 };
  }

  // If currently locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // If lockout expired, reset counter if it was long ago
  if (record.lockedUntil && record.lockedUntil <= now) {
    record.lockedUntil = null;
    record.count = 4; // allow 1 more attempt before re-locking
  }

  const remaining = Math.max(0, 5 - record.count);
  return { allowed: true, remainingAttempts: remaining };
}

/**
 * Records a failed attempt for this identifier.
 * Returns the lockout duration in seconds if locked out.
 */
export function recordFailedAttempt(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  let record = attemptsStore.get(identifier);

  if (!record) {
    record = {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      lockedUntil: null,
    };
    attemptsStore.set(identifier, record);
    return { locked: false };
  }

  record.count += 1;
  record.lastAttemptAt = now;

  if (record.count >= 10) {
    // Tier 2 lockout: 30 minutes
    record.lockedUntil = now + 30 * 60 * 1000;
    return { locked: true, retryAfterSeconds: 1800 };
  } else if (record.count >= 5) {
    // Tier 1 lockout: 5 minutes
    record.lockedUntil = now + 5 * 60 * 1000;
    return { locked: true, retryAfterSeconds: 300 };
  }

  return { locked: false };
}

/**
 * Clears attempt tracking upon a successful authentication.
 */
export function resetAttempts(identifier: string): void {
  attemptsStore.delete(identifier);
}

/**
 * Extracts the client IP from standard reverse proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}
