/**
 * Log Throttle Utility
 * Prevents excessive logging of the same error/message
 * Limits to 1 log per minute per unique message
 */

interface ThrottleEntry {
  count: number;
  lastLogged: number;
}

const throttleMap = new Map<string, ThrottleEntry>();
const THROTTLE_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ENTRIES = 1000; // Maximum throttle entries to prevent memory leak

/**
 * Generate a key for throttling based on message and optional context
 */
function generateThrottleKey(message: string, context?: Record<string, any>): string {
  if (context && Object.keys(context).length > 0) {
    // Include relevant context keys in throttle key
    const contextKeys = Object.keys(context).sort();
    const contextStr = contextKeys
      .map(key => `${key}:${String(context[key]).substring(0, 50)}`)
      .join('|');
    return `${message}|${contextStr}`;
  }
  return message;
}

/**
 * Clean up old throttle entries to prevent memory leaks
 */
function cleanupThrottleMap() {
  if (throttleMap.size <= MAX_ENTRIES) {
    return;
  }

  const now = Date.now();
  const entriesToDelete: string[] = [];

  for (const [key, entry] of throttleMap.entries()) {
    // Remove entries older than throttle window
    if (now - entry.lastLogged > THROTTLE_WINDOW_MS) {
      entriesToDelete.push(key);
    }
  }

  // If still over limit, remove oldest entries
  if (throttleMap.size - entriesToDelete.length > MAX_ENTRIES) {
    const sortedEntries = Array.from(throttleMap.entries())
      .sort((a, b) => a[1].lastLogged - b[1].lastLogged);
    
    const toRemove = throttleMap.size - MAX_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
      entriesToDelete.push(sortedEntries[i][0]);
    }
  }

  entriesToDelete.forEach(key => throttleMap.delete(key));
}

/**
 * Check if a log message should be throttled
 * Returns true if the message should be logged, false if it should be throttled
 */
export function shouldLog(message: string, context?: Record<string, any>): boolean {
  cleanupThrottleMap();

  const key = generateThrottleKey(message, context);
  const now = Date.now();
  const entry = throttleMap.get(key);

  if (!entry) {
    // First time seeing this message, allow it
    throttleMap.set(key, { count: 1, lastLogged: now });
    return true;
  }

  // Check if enough time has passed since last log
  if (now - entry.lastLogged >= THROTTLE_WINDOW_MS) {
    // Update entry
    entry.count++;
    entry.lastLogged = now;
    return true;
  }

  // Still within throttle window, suppress log
  entry.count++;
  return false;
}

/**
 * Get throttle statistics for a message (for debugging)
 */
export function getThrottleStats(message: string, context?: Record<string, any>): {
  count: number;
  lastLogged: number;
  timeSinceLastLog: number;
} | null {
  const key = generateThrottleKey(message, context);
  const entry = throttleMap.get(key);
  
  if (!entry) {
    return null;
  }

  return {
    count: entry.count,
    lastLogged: entry.lastLogged,
    timeSinceLastLog: Date.now() - entry.lastLogged,
  };
}

/**
 * Clear throttle map (useful for testing)
 */
export function clearThrottle(): void {
  throttleMap.clear();
}
