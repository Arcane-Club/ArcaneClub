import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendVerificationCode = async (email: string, code: string) => {
  const subject = 'Your Verification Code - Arcane Club';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verification Code</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #4a90e2; letter-spacing: 5px;">${code}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
    </div>
  `;
  return sendEmail(email, subject, html);
};
