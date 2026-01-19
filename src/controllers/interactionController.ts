import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotificationType } from '@prisma/client';
import { createNotification } from '../services/notificationService';

// 点赞/取消点赞
export const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.postLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      res.json({ success: true, data: { liked: false } });
    } else {
      // 点赞
      const [newLike, updatedPost] = await prisma.$transaction([
        prisma.postLike.create({
          data: { userId, postId },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      if (updatedPost.authorId !== userId) {
        console.log(`Creating notification for user ${updatedPost.authorId} from user ${userId}`);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        await createNotification(
          updatedPost.authorId,
          NotificationType.LIKE,
          '收到点赞',
          `${user?.username || '有人'} 点赞了你的帖子`,
          `/posts/${postId}`
        );
      } else {
        console.log(`Skipping notification for self-like: user ${userId}`);
      }

      res.json({ success: true, data: { liked: true } });
    }
  } catch (error) {
    next(error);
  }
};

// 收藏/取消收藏
export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      res.json({ success: true, data: { favorited: false } });
    } else {
      const favorite = await prisma.favorite.create({
        data: { userId, postId },
      });
      
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post && post.authorId !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        await createNotification(
          post.authorId,
          NotificationType.FAVORITE,
          '收到收藏',
          `${user?.username || '有人'} 收藏了你的帖子`,
          `/posts/${postId}`
        );
      }

      res.json({ success: true, data: { favorited: true } });
    }
  } catch (error) {
    next(error);
  }
};
