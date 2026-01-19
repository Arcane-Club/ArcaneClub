import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getSidebarData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        boards: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
