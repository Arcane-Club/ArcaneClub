import express from 'express';
import { getBingDailyImage } from '../controllers/miscController';
import { getPublicNavigations } from '../controllers/navigationController';
import { getPublicPageBySlug } from '../controllers/cmsPageController';

const router = express.Router();

router.get('/bing-daily-image', getBingDailyImage);
router.get('/navigations', getPublicNavigations);
router.get('/pages/:slug', getPublicPageBySlug);

export default router;
