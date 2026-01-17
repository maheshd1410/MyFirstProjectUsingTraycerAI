import Queue from 'bull';
import { getRedisClient } from '../config/redis';
import logger from '../config/logger';
import { emailConfig, createEmailTransporter } from '../config/email';
import { EmailJobData } from './email.service';
import { prisma } from '../config/database';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Create email queue
export const emailQueue = new Queue<EmailJobData & { emailLogId: string }>('email-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    attempts: emailConfig.retries,
    backoff: {
      type: 'exponential',
      delay: emailConfig.retryDelay,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Template cache
const templateCache = new Map<string, HandlebarsTemplateDelegate>();
const templatesPath = path.join(__dirname, '../templates/emails');

/**
 * Compile and cache email template
 */
function compileTemplate(templateName: string): HandlebarsTemplateDelegate {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  try {
    const templatePath = path.join(templatesPath, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const compiled = handlebars.compile(templateSource);
    templateCache.set(templateName, compiled);
    return compiled;
  } catch (error) {
    logger.error(`Failed to compile email template: ${templateName}`, { error });
    throw new Error(`Template ${templateName} not found`);
  }
}

/**
 * Render email template with context
 */
function renderTemplate(templateName: string, context: Record<string, any>): string {
  const template = compileTemplate(templateName);
  return template(context);
}

/**
 * Process email job
 */
emailQueue.process(async (job) => {
  const { data } = job;
  const { emailLogId, to, subject, template, context, html, text, attachments } = data;

  logger.info('Processing email job', {
    jobId: job.id,
    emailLogId,
    type: data.type,
    to,
    attempt: job.attemptsMade + 1,
  });

  try {
    // Update retryCount
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: { retryCount: job.attemptsMade + 1 },
    });

    // Create transporter
    const transporter = createEmailTransporter();

    // Render template if provided
    let renderedHtml = html;
    if (template && context) {
      renderedHtml = renderTemplate(template, context);
    }

    // Send email
    const mailOptions = {
      from: emailConfig.from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: renderedHtml,
      text,
      attachments,
      replyTo: emailConfig.replyTo,
    };

    const result = await transporter.sendMail(mailOptions);

    // Update status to SENT
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        retryCount: job.attemptsMade + 1,
      },
    });

    logger.info('Email sent successfully', {
      jobId: job.id,
      emailLogId,
      messageId: result.messageId,
      to,
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    logger.error('Failed to send email', {
      jobId: job.id,
      emailLogId,
      to,
      attempt: job.attemptsMade + 1,
      error: error.message,
    });

    // Update status to FAILED
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        failedAt: new Date(),
        retryCount: job.attemptsMade + 1,
      },
    });

    throw error;
  }
});

/**
 * Handle failed jobs
 */
emailQueue.on('failed', async (job, error) => {
  logger.error('Email job failed', {
    jobId: job.id,
    emailLogId: job.data.emailLogId,
    type: job.data.type,
    to: job.data.to,
    attempts: job.attemptsMade,
    error: error.message,
  });

  // If max retries reached, mark as failed permanently
  if (job.attemptsMade >= emailConfig.retries) {
    await prisma.emailLog.update({
      where: { id: job.data.emailLogId },
      data: {
        status: 'FAILED',
        error: `Failed after ${job.attemptsMade} attempts: ${error.message}`,
        attempts: job.attemptsMade,
      },
    });
  }
});

/**
 * Handle completed jobs
 */
emailQueue.on('completed', (job) => {
  logger.info('Email job completed', {
    jobId: job.id,
    emailLogId: job.data.emailLogId,
    type: job.data.type,
    to: job.data.to,
  });
});

/**
 * Initialize email queue
 */
export async function initializeEmailQueue(): Promise<void> {
  try {
    // Clean old completed jobs
    await emailQueue.clean(24 * 60 * 60 * 1000); // 24 hours

    logger.info('Email queue initialized successfully', {
      name: emailQueue.name,
      retries: emailConfig.retries,
      retryDelay: emailConfig.retryDelay,
    });
  } catch (error) {
    logger.error('Failed to initialize email queue', { error });
    throw error;
  }
}

/**
 * Close email queue gracefully
 */
export async function closeEmailQueue(): Promise<void> {
  try {
    await emailQueue.close();
    logger.info('Email queue closed successfully');
  } catch (error) {
    logger.error('Failed to close email queue', { error });
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getEmailQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('Failed to get email queue stats', { error });
    return null;
  }
}
