import { Job } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { sendDigestEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";

export interface DailyDigestJobData {
  scheduledAt: Date;
}

export async function processDailyDigest(job: Job<DailyDigestJobData>) {
  try {
    logger.info("Processing daily digest...");

    // Get all approved subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: { status: "approved" },
    });

    if (subscribers.length === 0) {
      logger.info("No approved subscribers found");
      return { success: true, recipients: 0, items: 0 };
    }

    // Get items from last 24 hours: up to 10 most voted, then fill with others until 10
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dateFilter = { publishedAt: { gte: yesterday } };

    const topByVotes = await prisma.item.findMany({
      where: dateFilter,
      include: { feed: true },
      orderBy: { likes: "desc" },
      take: 10,
    });

    let items = topByVotes;
    if (items.length < 10) {
      const excludeIds = items.map((i) => i.id);
      const fill = await prisma.item.findMany({
        where: {
          ...dateFilter,
          ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        },
        include: { feed: true },
        orderBy: { publishedAt: "desc" },
        take: 10 - items.length,
      });
      items = [...items, ...fill];
    }

    if (items.length === 0) {
      logger.info("No items found for digest");
      return { success: true, recipients: 0, items: 0 };
    }

    // Send digest to each subscriber
    let sentCount = 0;
    for (const subscriber of subscribers) {
      try {
        await sendDigestEmail(
          subscriber.email,
          subscriber.name,
          items,
        );
        sentCount++;
      } catch (error) {
        logger.error(`Failed to send digest to ${subscriber.email}`, error as Error);
      }
    }

    // Log the digest
    await prisma.dailyDigestLog.create({
      data: {
        numRecipients: sentCount,
        numItems: items.length,
      },
    });

    logger.info(`Daily digest sent to ${sentCount} recipients with ${items.length} items`);

    return {
      success: true,
      recipients: sentCount,
      items: items.length,
    };
  } catch (error) {
    logger.error("Error processing daily digest", error as Error);
    throw error;
  }
}

