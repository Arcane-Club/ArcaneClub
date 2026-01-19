import { Request, Response } from 'express';
import axios from 'axios';

export const getBingDailyImage = async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
    const imagePath = response.data.images[0].url;
    const imageUrl = `https://www.bing.com${imagePath}`;
    res.json({ success: true, data: { url: imageUrl } });
  } catch (error) {
    console.error('Error fetching Bing image:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Bing image' });
  }
};
