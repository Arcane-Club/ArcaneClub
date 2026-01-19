import { Router } from 'express';
import { getCategories, getSidebarData } from '../controllers/categoryController';
import { getPosts, getPostDetail, createPost } from '../controllers/postController';
import { createComment, getComments } from '../controllers/commentController';
import { toggleLike, toggleFavorite } from '../controllers/interactionController';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Public routes (some with optional auth)
router.get('/categories', getCategories);
router.get('/sidebar', getSidebarData);
router.get('/posts', getPosts);
router.get('/posts/:id', optionalAuthMiddleware, getPostDetail);
router.get('/posts/:id/comments', getComments);

// Protected routes
router.post('/posts', authMiddleware, createPost);
router.post('/posts/:postId/comments', authMiddleware, createComment);
router.post('/posts/:postId/like', authMiddleware, toggleLike);
router.post('/posts/:postId/favorite', authMiddleware, toggleFavorite);

export default router;
