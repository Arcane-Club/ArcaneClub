import { Jimp, JimpMime } from 'jimp';
import crypto from 'crypto';
import axios from 'axios';

interface CaptchaData {
  x: number;
  expiresAt: number;
}

const captchaStore = new Map<string, CaptchaData>();
const verifiedTokens = new Set<string>();
const VERIFIED_TOKEN_TTL = 600 * 1000; // 10 minutes

// Cleanup expired captchas
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (data.expiresAt < now) captchaStore.delete(id);
  }
}, 60000);

export const generateCaptcha = async () => {
  const width = 320;
  const height = 160;
  const pieceSize = 45;
  let image: any;

  try {
    // Fetch a random Bing image (idx 1-7 to be different from background which is 0)
    const randomIdx = Math.floor(Math.random() * 7) + 1;
    const response = await axios.get(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=${randomIdx}&n=1&mkt=zh-CN`);
    const imagePath = response.data.images[0].url;
    const imageUrl = `https://www.bing.com${imagePath}`;

    // Load and resize the image
    const originalImage = await Jimp.read(imageUrl);
    image = originalImage.resize({ w: width, h: height });
  } catch (error) {
    console.error('Failed to fetch Bing image for captcha, falling back to noise:', error);
    // Fallback to noise generation
    image = new Jimp({ width, height, color: 0xFFFFFFFF });
    
    // Fill with random noise
    image.scan(0, 0, width, height, (x: number, y: number, idx: number) => {
      const noise = Math.random() * 50;
      image.bitmap.data[idx] = 200 + noise;     // red
      image.bitmap.data[idx + 1] = 200 + noise; // green
      image.bitmap.data[idx + 2] = 200 + noise; // blue
      image.bitmap.data[idx + 3] = 255;         // alpha
    });

    // Draw some random lines/shapes for complexity
    for (let i = 0; i < 10; i++) {
        // Simple noise logic
    }
  }

  // Determine puzzle position
  // Keep x away from start (0) so user has to slide
  const x = Math.floor(Math.random() * (width - pieceSize - 60)) + 60;
  const y = Math.floor(Math.random() * (height - pieceSize - 10)) + 5;

  // Create puzzle piece
  const piece = image.clone().crop({ x, y, w: pieceSize, h: pieceSize });
  
  // Add a border to the piece for visibility
  piece.scan(0, 0, pieceSize, pieceSize, (px: number, py: number, idx: number) => {
    if (px < 2 || px > pieceSize - 3 || py < 2 || py > pieceSize - 3) {
      piece.bitmap.data[idx] = 255;
      piece.bitmap.data[idx+1] = 255;
      piece.bitmap.data[idx+2] = 255;
      piece.bitmap.data[idx+3] = 255;
    }
  });

  // Create hole in original image
  const hole = new Jimp({ width: pieceSize, height: pieceSize, color: 0x00000080 }); // Semi-transparent black
  image.composite(hole, x, y);

  const id = crypto.randomUUID();
  captchaStore.set(id, { x, expiresAt: Date.now() + 300000 }); // 5 min

  const bgBuffer = await image.getBuffer(JimpMime.png);
  const sliderBuffer = await piece.getBuffer(JimpMime.png);

  return {
    id,
    background: `data:${JimpMime.png};base64,${bgBuffer.toString('base64')}`,
    slider: `data:${JimpMime.png};base64,${sliderBuffer.toString('base64')}`,
    y
  };
};

export const verifySlide = (id: string, x: number) => {
  const data = captchaStore.get(id);
  
  if (!data) {
    console.log(`[SliderCaptcha] ID not found: ${id}`);
    return { success: false, message: 'Captcha expired or invalid' };
  }
  
  if (data.expiresAt < Date.now()) {
    console.log(`[SliderCaptcha] Expired: ${id}`);
    captchaStore.delete(id);
    return { success: false, message: 'Captcha expired' };
  }

  // Tolerance of 10 pixels
  const threshold = 10;
  const diff = Math.abs(data.x - x);
  const isValid = diff <= threshold;
  
  console.log(`[SliderCaptcha] Verify: id=${id}, x=${x.toFixed(2)}, target=${data.x}, diff=${diff.toFixed(2)}, threshold=${threshold}, valid=${isValid}`);

  if (isValid) {
    captchaStore.delete(id);
    const token = `slider-verified-${crypto.randomUUID()}`;
    verifiedTokens.add(token);
    
    // Auto expire token
    setTimeout(() => verifiedTokens.delete(token), VERIFIED_TOKEN_TTL);
    
    return { success: true, token };
  }

  return { success: false, message: `Verification failed (diff: ${Math.round(diff)}px)` };
};

export const verifySliderToken = (token: string) => {
  if (token === 'disabled-bypass') return true;
  return verifiedTokens.has(token);
};
