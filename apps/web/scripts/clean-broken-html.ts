/**
 * Script to clean existing feed items with broken HTML attributes
 * Run with: npx tsx apps/web/scripts/clean-broken-html.ts
 * Or: node -r ts-node/register apps/web/scripts/clean-broken-html.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanBrokenHtmlAttributes() {
  console.log('Starting cleanup of broken HTML attributes in feed items...');

  try {
    // Find items with broken attributes
    const itemsWithBrokenHtml = await prisma.item.findMany({
      where: {
        OR: [
          { title: { contains: '=""' } },
          { summary: { contains: '=""' } },
        ],
      },
      select: {
        id: true,
        title: true,
        summary: true,
      },
    });

    console.log(`Found ${itemsWithBrokenHtml.length} items with broken HTML attributes`);

    if (itemsWithBrokenHtml.length === 0) {
      console.log('No items to clean. Exiting.');
      return;
    }

    let cleaned = 0;

    // Clean each item
    for (const item of itemsWithBrokenHtml) {
      const cleanTitle = item.title
        .replace(/=""/g, '')
        .replace(/="[^"]*"/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      const cleanSummary = item.summary
        ? item.summary
            .replace(/=""/g, '')
            .replace(/="[^"]*"/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim()
        : null;

      // Only update if something changed
      if (cleanTitle !== item.title || cleanSummary !== item.summary) {
        await prisma.item.update({
          where: { id: item.id },
          data: {
            title: cleanTitle,
            summary: cleanSummary,
          },
        });
        cleaned++;
      }
    }

    console.log(`Cleaned ${cleaned} items successfully.`);
  } catch (error) {
    console.error('Error cleaning broken HTML attributes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  cleanBrokenHtmlAttributes()
    .then(() => {
      console.log('Cleanup completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanBrokenHtmlAttributes };
