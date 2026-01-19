import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, boardId } = req.body;
    const userId = req.user!.id;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        boardId,
        authorId: userId,
      },
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, boardId, sort = 'newest' } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (boardId) {
      where.boardId = boardId as string;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { viewCount: 'desc' };
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          board: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            }
          }
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPostDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        board: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // 增加阅读数 (简单实现，不防刷)
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 检查用户交互状态 (如果已登录)
    let isLiked = false;
    let isFavorited = false;
    
    if (req.user) {
      const userId = req.user.id;
      const [like, favorite] = await Promise.all([
        prisma.postLike.findUnique({ where: { userId_postId: { userId, postId: id } } }),
        prisma.favorite.findUnique({ where: { userId_postId: { userId, postId: id } } }),
      ]);
      isLiked = !!like;
      isFavorited = !!favorite;
    }

    res.json({
      success: true,
      data: {
        ...post,
        isLiked,
        isFavorited,
      },
    });
  } catch (error) {
    next(error);
  }
};
