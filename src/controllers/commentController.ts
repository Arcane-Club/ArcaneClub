import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotificationType } from '@prisma/client';
import { createNotification } from '../services/notificationService';
import axios from 'axios';

// 获取IP归属地
async function getLocationByIp(ip: string): Promise<string | null> {
  // 本地IP直接返回
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return '本地';
  }

  try {
    const response = await axios.get(`https://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`, {
      responseType: 'arraybuffer', // 关键：以二进制方式接收
      timeout: 3000
    });

    // 解码 GBK
    const decoder = new TextDecoder('gbk');
    const text = decoder.decode(response.data);
    
    // 清理可能存在的空白字符并解析
    const data = JSON.parse(text.trim());
    
    // 用户要求精确到省
    return data.pro || null;
  } catch (error) {
    console.error(`Failed to fetch location for IP ${ip}:`, error);
    return null;
  }
}

// 创建评论
export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, parentId, replyToUserId } = req.body;
    const { postId } = req.params;
    const userId = req.user!.id;

    // 获取IP
    let ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    // 处理 IPv6 映射的 IPv4
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    // 获取归属地
    let location = null;
    if (ip) {
      location = await getLocationByIp(ip);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId,
        replyToUserId: replyToUserId || null,
        ip,
        location
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true, role: true },
        },
        replyToUser: {
          select: { id: true, username: true },
        },
      },
    });

    // 更新帖子评论数
    const post = await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    // 通知帖子作者
    if (post.authorId !== userId) {
      await createNotification(
        post.authorId,
        NotificationType.COMMENT,
        '收到评论',
        `${comment.author.username || '有人'} 评论了你的帖子`,
        `/posts/${postId}`
      );
    }

    // 如果是回复，通知被回复的人
    if (parentId) {
      // 优先通知 replyToUserId (明确回复某人)
      // 如果没有 replyToUserId，则通知 parentId 的作者 (回复主楼层)
      // 需要避免重复通知 (如果 replyToUserId 就是 parentComment.authorId)
      
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      
      const notifiedUsers = new Set<string>();
      if (post.authorId !== userId) notifiedUsers.add(post.authorId); // 已经通知了帖子作者

      // 通知明确被回复的人
      if (replyToUserId && replyToUserId !== userId && !notifiedUsers.has(replyToUserId)) {
         await createNotification(
          replyToUserId,
          NotificationType.COMMENT,
          '收到回复',
          `${comment.author.username || '有人'} 回复了你的评论`,
          `/posts/${postId}`
        );
        notifiedUsers.add(replyToUserId);
      }

      // 如果被回复的人不是帖子作者，且不是自己，且还没被通知（例如回复的是层主）
      if (parentComment && parentComment.authorId !== userId && !notifiedUsers.has(parentComment.authorId)) {
         await createNotification(
          parentComment.authorId,
          NotificationType.COMMENT,
          '收到回复',
          `${comment.author.username || '有人'} 回复了你的评论`,
          `/posts/${postId}`
        );
      }
    }

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// 获取评论列表
export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;
    
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: {
          select: { id: true, username: true, avatar: true, role: true },
        },
        replies: {
          include: {
             author: {
               select: { id: true, username: true, avatar: true, role: true },
             },
             replyToUser: {
               select: { id: true, username: true },
             },
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};
