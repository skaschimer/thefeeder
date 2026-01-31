import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/auth';
import { prisma } from '@/src/lib/prisma';

/**
 * PATCH /api/notifications/read-all
 * Mark all unread notifications as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.feedNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error) {
    console.error('[API] Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
