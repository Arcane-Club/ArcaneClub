import axios from 'axios';

export const verifyTurnstileToken = async (token: string): Promise<boolean> => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not set, skipping verification (development mode only)');
    return true; // 如果没有设置 key，开发环境下默认通过，生产环境应强制检查
  }

  try {
    const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      secret: secretKey,
      response: token,
    });

    return response.data.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
};
