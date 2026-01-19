import axios from 'axios';

export interface IpInfo {
  ip: string;
  pro: string;
  proCode: string;
  city: string;
  cityCode: string;
  region: string;
  regionCode: string;
  addr: string;
  regionNames: string;
  err: string;
}

export const getIpInfo = async (): Promise<IpInfo | null> => {
  try {
    const response = await axios.get('/api/ip');
    return response.data;
  } catch (error) {
    console.error('Failed to get IP info:', error);
    return null;
  }
};
