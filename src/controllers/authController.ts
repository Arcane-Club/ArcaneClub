import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CodeType, NotificationType } from '@prisma/client';
import prisma from '../utils/prisma';
import { sendVerificationCode } from '../services/emailService';
import { verifyTurnstileToken } from '../services/turnstileService';
import { createNotification } from '../services/notificationService';

// 生成6位数字验证码
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// 发送验证码
export const sendCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, type } = req.body; // type: REGISTER | LOGIN | PASSWORD_RESET

    if (!email || !type) {
      return res.status(400).json({ success: false, message: 'Email and type are required' });
    }

    // 检查是否已有频繁发送 (1分钟内)
    const lastCode = await prisma.verificationCode.findFirst({
      where: { email, type },
      orderBy: { createdAt: 'desc' },
    });

    if (lastCode && new Date().getTime() - lastCode.createdAt.getTime() < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait a minute before requesting another code' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    });

    const emailSent = await sendVerificationCode(email, code);

    if (!emailSent) {
      return res.status(500).json({ success: false, message: 'Failed to send email' });
    }

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    next(error);
  }
};

// 注册
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, code, turnstileToken } = req.body;

    if (!email || !password || !code) {
      return res.status(400).json({ success: false, message: 'Email, password, and code are required' });
    }

    // 验证 Turnstile
    const isHuman = await verifyTurnstileToken(turnstileToken);
    if (!isHuman) {
      return res.status(400).json({ success: false, message: 'Turnstile verification failed' });
    }

    // 验证验证码
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: CodeType.REGISTER,
        expiresAt: { gt: new Date() },
      },
    });

    if (!validCode) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    // 删除验证码
    await prisma.verificationCode.deleteMany({ where: { email, type: CodeType.REGISTER } });

    // 生成 Token
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    // 发送欢迎通知
    await createNotification(
      user.id,
      NotificationType.SYSTEM,
      '欢迎加入',
      '感谢您注册 Arcane Club！我们希望您能在这里度过愉快的时光。'
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 登录
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, code, type, turnstileToken } = req.body; // type: PASSWORD | CODE

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // 验证 Turnstile
    const isHuman = await verifyTurnstileToken(turnstileToken);
    if (!isHuman) {
      return res.status(400).json({ success: false, message: 'Turnstile verification failed' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (type === 'PASSWORD') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
      }
    } else if (type === 'CODE') {
      if (!code) {
        return res.status(400).json({ success: false, message: 'Verification code is required' });
      }
      const validCode = await prisma.verificationCode.findFirst({
        where: {
          email,
          code,
          type: CodeType.LOGIN,
          expiresAt: { gt: new Date() },
        },
      });

      if (!validCode) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }
      
      // 删除验证码
      await prisma.verificationCode.deleteMany({ where: { email, type: CodeType.LOGIN } });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid login type' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    // 发送登录通知
    await createNotification(
      user.id,
      NotificationType.SYSTEM,
      '登录提醒',
      `您的账号于 ${new Date().toLocaleString()} 登录。如果这不是您本人的操作，请立即更改密码。`
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};
