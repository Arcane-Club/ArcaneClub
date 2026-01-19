import { Router } from 'express';
import { getPublicSiteConfig, getPublicConfig } from '../controllers/settingController';

const router = Router();

router.get('/public', getPublicConfig);
router.get('/site', getPublicSiteConfig);

export default router;
