import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getHealthStatus as getRedisHealth } from "@/src/lib/cache";
import { logger } from "@/src/lib/logger";

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: "healthy" | "unhealthy";
      connected: boolean;
      error?: string;
    };
  };
  metrics: {
    feeds: {
      total: number;
      active: number;
      paused: number;
      degraded: number;
    };
    items: {
      total: number;
    };
    subscribers: {
      total: number;
      approved: number;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthCheckResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: {
        status: "unhealthy",
      },
      redis: {
        status: "unhealthy",
        connected: false,
      },
    },
    metrics: {
      feeds: {
        total: 0,
        active: 0,
        paused: 0,
        degraded: 0,
      },
      items: {
        total: 0,
      },
      subscribers: {
        total: 0,
        approved: 0,
      },
    },
  };

  // Check database
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = {
      status: "healthy",
      responseTime: Date.now() - dbStartTime,
    };
  } catch (error: any) {
    health.services.database = {
      status: "unhealthy",
      error: error.message || "Database connection failed",
    };
    health.status = "unhealthy";
  }

  // Check Redis
  try {
    const redisHealth = await getRedisHealth();
    health.services.redis = {
      status: redisHealth.connected ? "healthy" : "unhealthy",
      connected: redisHealth.connected,
      error: redisHealth.error,
    };
    if (!redisHealth.connected) {
      health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
    }
  } catch (error: any) {
    health.services.redis = {
      status: "unhealthy",
      connected: false,
      error: error.message || "Redis check failed",
    };
    health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
  }

  // Get metrics (only if database is healthy)
  if (health.services.database.status === "healthy") {
    try {
      const [feeds, items, subscribers] = await Promise.all([
        prisma.feed.findMany({
          select: {
            isActive: true,
            status: true,
          },
        }),
        prisma.item.count(),
        prisma.subscriber.findMany({
          select: {
            status: true,
          },
        }),
      ]);

      health.metrics.feeds.total = feeds.length;
      health.metrics.feeds.active = feeds.filter(
        (f) => f.isActive && f.status === "active",
      ).length;
      health.metrics.feeds.paused = feeds.filter(
        (f) => f.status === "paused",
      ).length;
      health.metrics.feeds.degraded = feeds.filter(
        (f) => f.status === "degraded",
      ).length;

      health.metrics.items.total = items;

      health.metrics.subscribers.total = subscribers.length;
      health.metrics.subscribers.approved = subscribers.filter(
        (s) => s.status === "approved",
      ).length;
    } catch (error: any) {
      // Metrics failure doesn't affect health status
      logger.error("[Health Check] Error fetching metrics", error instanceof Error ? error : new Error(String(error)));
    }
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
