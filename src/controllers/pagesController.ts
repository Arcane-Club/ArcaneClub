import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import fs from 'fs';
import path from 'path';

export const getAdminPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      customPagePath: { not: null }, // Only users with a deployed page
    };

    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' }, // Or sort by deployed date if we had it, but updatedAt is close enough for user updates
        select: {
          id: true,
          username: true,
          email: true,
          customPagePath: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        pages: users,
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

export const deleteAdminPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.customPagePath) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Delete the file
    const fullPath = path.join(process.cwd(), user.customPagePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('Failed to delete page file:', err);
        // Continue to clear DB entry even if file delete fails (or maybe throw? but better to clear state)
      }
    }

    // Clear the customPagePath in DB
    await prisma.user.update({
      where: { id: userId },
      data: { customPagePath: null },
    });

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    next(error);
  }
};
