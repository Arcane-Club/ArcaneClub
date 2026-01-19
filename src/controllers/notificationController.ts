import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 latest
    });
    const unreadCount = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    if (id === 'all') {
         await prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true },
         });
    } else {
        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id },
        });
        if (!notification || notification.recipientId !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
