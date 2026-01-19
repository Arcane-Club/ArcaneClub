import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [userCount, postCount, commentCount] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true } },
        board: { select: { name: true } },
      },
    });

    res.json({
      success: true,
      data: {
        stats: {
          userCount,
          postCount,
          commentCount,
        },
        recentUsers,
        recentPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
};

// --- Post Management ---

export const getAdminPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { username: true } },
          board: { select: { name: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
export const updatePostStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const post = await prisma.post.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};
*/

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.post.delete({ where: { id } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// --- Comment Management ---

export const getAdminComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.content = { contains: search as string, mode: 'insensitive' };
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { username: true } },
          post: { select: { title: true, id: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.comment.delete({ where: { id } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// --- Banned Words Management ---

export const getBannedWords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const words = await prisma.bannedWord.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: words });
  } catch (error) {
    next(error);
  }
};

export const addBannedWord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { word } = req.body;
    const newWord = await prisma.bannedWord.create({
      data: { word },
    });
    res.json({ success: true, data: newWord });
  } catch (error) {
    next(error);
  }
};

export const deleteBannedWord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.bannedWord.delete({ where: { id } });
    res.json({ success: true, message: 'Word deleted' });
  } catch (error) {
    next(error);
  }
};

// --- Board Management ---

export const getAdminBoards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boards = await prisma.board.findMany({
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: boards });
  } catch (error) {
    next(error);
  }
};

export const createBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, categoryId, sortOrder } = req.body;
    const board = await prisma.board.create({
      data: { name, slug, description, categoryId, sortOrder },
    });
    res.json({ success: true, data: board });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, description, categoryId, sortOrder } = req.body;
    const board = await prisma.board.update({
      where: { id },
      data: { name, slug, description, categoryId, sortOrder },
    });
    res.json({ success: true, data: board });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.board.delete({ where: { id } });
    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    next(error);
  }
};

// --- Categories (Needed for Board Management) ---
export const getAdminCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

// --- User Management ---

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          avatar: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'USER', 'ADMIN', 'MODERATOR'

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};


