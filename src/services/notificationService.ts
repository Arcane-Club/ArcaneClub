import prisma from '../utils/prisma';
import { NotificationType } from '@prisma/client';

export const createNotification = async (
  recipientId: string,
  type: NotificationType,
  title: string,
  content: string = '',
  relatedLink: string = ''
) => {
  try {
    await prisma.notification.create({
      data: {
        recipientId,
        type,
        title,
        content,
        relatedLink,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
