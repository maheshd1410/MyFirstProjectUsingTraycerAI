import nodemailer from 'nodemailer';
import logger from './logger';

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid';
  from: string;
  replyTo?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  retries: number;
  retryDelay: number;
}

export const emailConfig: EmailConfig = {
  provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid') || 'smtp',
  from: process.env.EMAIL_FROM || 'noreply@ladoobusiness.com',
  replyTo: process.env.EMAIL_REPLY_TO,
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },
  retries: parseInt(process.env.EMAIL_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '60000', 10), // 1 minute
};

// Create nodemailer transporter based on provider
export const createEmailTransporter = () => {
  if (emailConfig.provider === 'smtp') {
    logger.info('Creating SMTP email transporter', {
      host: emailConfig.smtp?.host,
      port: emailConfig.smtp?.port,
      secure: emailConfig.smtp?.secure,
    });

    return nodemailer.createTransport({
      host: emailConfig.smtp?.host,
      port: emailConfig.smtp?.port,
      secure: emailConfig.smtp?.secure,
      auth: {
        user: emailConfig.smtp?.auth.user,
        pass: emailConfig.smtp?.auth.pass,
      },
    });
  }

  if (emailConfig.provider === 'sendgrid') {
    logger.info('Creating SendGrid email transporter');
    
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: emailConfig.sendgrid?.apiKey,
      },
    });
  }

  throw new Error(`Unsupported email provider: ${emailConfig.provider}`);
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed', { error });
    return false;
  }
};
