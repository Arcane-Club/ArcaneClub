import { Request, Response, NextFunction } from 'express';
import { generateCaptcha, verifySlide } from '../services/sliderCaptchaService';

export const getSliderCaptcha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await generateCaptcha();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const verifySliderCaptcha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, x } = req.body;
    if (!id || x === undefined) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }
    
    const result = verifySlide(id, parseFloat(x));
    
    if (result.success) {
      res.json({ success: true, token: result.token });
    } else {
      res.json({ success: false, message: result.message || 'Verification failed' });
    }
  } catch (error) {
    next(error);
  }
};
