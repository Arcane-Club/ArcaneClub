import { Router } from 'express';
import { getSliderCaptcha, verifySliderCaptcha } from '../controllers/captchaController';

const router = Router();

router.get('/slider', getSliderCaptcha);
router.post('/slider/verify', verifySliderCaptcha);

export default router;
