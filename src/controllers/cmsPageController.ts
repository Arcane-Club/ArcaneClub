import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  content: z.string(),
  published: z.boolean().optional(),
});

export const getPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
};

export const getPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const page = await prisma.page.findUnique({
      where: { id },
    });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

export const createPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = pageSchema.parse(req.body);
    
    // Check slug uniqueness
    const existing = await prisma.page.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const page = await prisma.page.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        published: data.published ?? false,
      },
    });
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

export const updatePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = pageSchema.partial().parse(req.body);

    if (data.slug) {
      const existing = await prisma.page.findUnique({ where: { slug: data.slug } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
    }

    const page = await prisma.page.update({
      where: { id },
      data,
    });
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

export const deletePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.page.delete({ where: { id } });
    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPublicPageBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const page = await prisma.page.findUnique({
      where: { slug },
    });
    
    if (!page || !page.published) {
      // Allow viewing unpublished pages if user is admin? For now just hide.
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};
