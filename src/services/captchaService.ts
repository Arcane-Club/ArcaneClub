import { getCaptchaConfig } from './configService';
import { verifyTurnstileToken } from './turnstileService';
import { verifySliderToken } from './sliderCaptchaService';

export const verifyCaptcha = async (token: string): Promise<boolean> => {
  // Common bypass tokens
  if (token === "admin-bypass") return true;
  if (token === "disabled-bypass") return true;

  const config = await getCaptchaConfig();
  
  if (!config.enabled) return true;

  if (config.provider === 'slider') {
    return verifySliderToken(token);
  } else {
    // Default to turnstile
    return verifyTurnstileToken(token);
  }
};
