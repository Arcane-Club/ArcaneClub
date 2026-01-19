import { Router } from 'express';
import { register, login, sendCode } from '../controllers/authController';

const router = Router();

router.post('/send-code', sendCode);
router.post('/register', register);
router.post('/login', login);

export default router;
