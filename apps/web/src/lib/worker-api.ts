// Utility to call worker API for scheduling feeds
import { logger } from "./logger";

const WORKER_API_URL = process.env.WORKER_API_URL || "http://localhost:7388";
const WORKER_API_TOKEN =
  process.env.NODE_ENV === "production"
    ? process.env.WORKER_API_TOKEN
    : process.env.WORKER_API_TOKEN || "change-me-in-production";

function requireToken(): string {
  if (process.env.NODE_ENV === "production" && !WORKER_API_TOKEN) {
    logger.error("WORKER_API_TOKEN is not set in production; cannot call worker API");
    throw new Error("Worker API token not configured");
  }
  return WORKER_API_TOKEN ?? "";
}

export async function scheduleFeed(feedId: string): Promise<void> {
  try {
    const token = requireToken();
    const response = await fetch(`${WORKER_API_URL}/api/schedule/${feedId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Failed to schedule feed`, new Error(error), { feedId });
      // Don't throw - scheduling failure shouldn't block feed creation
    }
  } catch (error) {
    logger.error(`Error calling worker API to schedule feed`, error instanceof Error ? error : new Error(String(error)), { feedId });
    // Don't throw - scheduling failure shouldn't block feed creation
  }
}

export async function unscheduleFeed(feedId: string): Promise<void> {
  try {
    const token = requireToken();
    const response = await fetch(`${WORKER_API_URL}/api/schedule/${feedId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Failed to unschedule feed`, new Error(error), { feedId });
      // Don't throw - unscheduling failure shouldn't block feed deletion
    }
  } catch (error) {
    logger.error(`Error calling worker API to unschedule feed`, error instanceof Error ? error : new Error(String(error)), { feedId });
    // Don't throw - unscheduling failure shouldn't block feed deletion
  }
}

/**
 * Trigger immediate feed fetch (used when a new feed is created or imported)
 * This does not affect the scheduled repeat job
 */
export async function fetchFeedImmediately(feedId: string): Promise<void> {
  try {
    const token = requireToken();
    const response = await fetch(`${WORKER_API_URL}/api/schedule/${feedId}/fetch`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Failed to trigger immediate fetch for feed`, new Error(error), { feedId });
      // Don't throw - fetch failure shouldn't block feed creation/import
    }
  } catch (error) {
    logger.error(`Error calling worker API to fetch feed immediately`, error instanceof Error ? error : new Error(String(error)), { feedId });
    // Don't throw - fetch failure shouldn't block feed creation/import
  }
}

