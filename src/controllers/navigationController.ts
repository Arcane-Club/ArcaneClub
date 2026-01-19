import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const getAdminNavigations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const navigations = await prisma.navbarItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: navigations });
  } catch (error) {
    next(error);
  }
};

export const createNavigation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label, url, sortOrder, isOpenNewTab, isVisible } = req.body;
    const navigation = await prisma.navbarItem.create({
      data: {
        label,
        url,
        sortOrder: sortOrder || 0,
        isOpenNewTab: isOpenNewTab || false,
        isVisible: isVisible !== undefined ? isVisible : true,
      },
    });
    res.status(201).json({ success: true, data: navigation });
  } catch (error) {
    next(error);
  }
};

export const updateNavigation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { label, url, sortOrder, isOpenNewTab, isVisible } = req.body;
    const navigation = await prisma.navbarItem.update({
      where: { id },
      data: {
        label,
        url,
        sortOrder,
        isOpenNewTab,
        isVisible,
      },
    });
    res.json({ success: true, data: navigation });
  } catch (error) {
    next(error);
  }
};

export const deleteNavigation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.navbarItem.delete({ where: { id } });
    res.json({ success: true, message: 'Navigation deleted' });
  } catch (error) {
    next(error);
  }
};

export const getPublicNavigations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const navigations = await prisma.navbarItem.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: navigations });
  } catch (error) {
    next(error);
  }
};
