import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';
import {
  getDashboardStats,
  getAdminPosts,
  // updatePostStatus,
  deletePost,
  getAdminComments,
  deleteComment,
  getBannedWords,
  addBannedWord,
  deleteBannedWord,
  getAdminBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  getAdminCategories,
  adminUpload,
  getAdminUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/adminController';
import { getAdminPages, deleteAdminPage } from '../controllers/pagesController';
import { getSettings, updateSettings } from '../controllers/settingController';
import {
  getAdminNavigations,
  createNavigation,
  updateNavigation,
  deleteNavigation,
} from '../controllers/navigationController';
import {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
} from '../controllers/cmsPageController';
import { upload } from '../utils/upload';

const router = Router();

// All routes require auth and admin role
router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/upload', upload.single('image'), adminUpload);

// Posts
router.get('/posts', getAdminPosts);
// router.patch('/posts/:id/status', updatePostStatus);
router.delete('/posts/:id', deletePost);

// Comments
router.get('/comments', getAdminComments);
router.delete('/comments/:id', deleteComment);

// Banned Words
router.get('/banned-words', getBannedWords);
router.post('/banned-words', addBannedWord);
router.delete('/banned-words/:id', deleteBannedWord);

// Boards
router.get('/boards', getAdminBoards);
router.post('/boards', createBoard);
router.put('/boards/:id', updateBoard);
router.delete('/boards/:id', deleteBoard);

// Categories
router.get('/categories', getAdminCategories);

// Pages
router.get('/pages', getAdminPages);
router.delete('/pages/:userId', deleteAdminPage);

// Navigations
router.get('/navigations', getAdminNavigations);
router.post('/navigations', createNavigation);
router.put('/navigations/:id', updateNavigation);
router.delete('/navigations/:id', deleteNavigation);

// CMS Pages
router.get('/cms-pages', getPages);
router.get('/cms-pages/:id', getPage);
router.post('/cms-pages', createPage);
router.put('/cms-pages/:id', updatePage);
router.delete('/cms-pages/:id', deletePage);

export default router;
