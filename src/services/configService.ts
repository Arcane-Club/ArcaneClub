import prisma from '../utils/prisma';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

export interface CaptchaConfig {
  provider: 'turnstile' | 'slider';
  siteKey: string;
  secretKey: string;
  enabled: boolean;
}

export interface PagesConfig {
  enabled: boolean;
  maxPagesPerUser: number;
}

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
}

export const defaultSmtpConfig: SmtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromName: 'Arcane Club',
  fromEmail: process.env.SMTP_FROM || '',
  enabled: !!process.env.SMTP_HOST, // Default enabled if env vars exist
};

export const defaultCaptchaConfig: CaptchaConfig = {
  provider: 'slider', // Default to slider as requested
  siteKey: process.env.TURNSTILE_SITE_KEY || '',
  secretKey: process.env.TURNSTILE_SECRET_KEY || '',
  enabled: true, // Default enabled
};

export const defaultPagesConfig: PagesConfig = {
  enabled: true,
  maxPagesPerUser: 1,
};

export const defaultSiteConfig: SiteConfig = {
  siteName: 'Arcane Club',
  siteDescription: 'A modern community for everyone.',
  siteLogo: '',
};

export const getSmtpConfig = async (): Promise<SmtpConfig> => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'smtp_config' },
  });
  if (setting) {
    return { ...defaultSmtpConfig, ...JSON.parse(setting.value) };
  }
  return defaultSmtpConfig;
};

export const getCaptchaConfig = async (): Promise<CaptchaConfig> => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'captcha_config' },
  });
  if (setting) {
    return { ...defaultCaptchaConfig, ...JSON.parse(setting.value) };
  }
  return defaultCaptchaConfig;
};

export const getPagesConfig = async (): Promise<PagesConfig> => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'pages_config' },
  });
  if (setting) {
    return { ...defaultPagesConfig, ...JSON.parse(setting.value) };
  }
  return defaultPagesConfig;
};

export const getSiteConfig = async (): Promise<SiteConfig> => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'site_config' },
  });
  if (setting) {
    return { ...defaultSiteConfig, ...JSON.parse(setting.value) };
  }
  return defaultSiteConfig;
};

export const updateSmtpConfig = async (config: SmtpConfig) => {
  await prisma.systemSetting.upsert({
    where: { key: 'smtp_config' },
    update: { value: JSON.stringify(config) },
    create: { key: 'smtp_config', value: JSON.stringify(config) },
  });
};

export const updateCaptchaConfig = async (config: CaptchaConfig) => {
  await prisma.systemSetting.upsert({
    where: { key: 'captcha_config' },
    update: { value: JSON.stringify(config) },
    create: { key: 'captcha_config', value: JSON.stringify(config) },
  });
};

export const updatePagesConfig = async (config: PagesConfig) => {
  await prisma.systemSetting.upsert({
    where: { key: 'pages_config' },
    update: { value: JSON.stringify(config) },
    create: { key: 'pages_config', value: JSON.stringify(config) },
  });
};

export const updateSiteConfig = async (config: SiteConfig) => {
  await prisma.systemSetting.upsert({
    where: { key: 'site_config' },
    update: { value: JSON.stringify(config) },
    create: { key: 'site_config', value: JSON.stringify(config) },
  });
};
