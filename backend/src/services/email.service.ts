import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { createEmailTransporter, emailConfig } from '../config/email';
import logger from '../config/logger';
import { emailQueue } from './email-queue.service';
import { prisma } from '../config/database';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: any[];
}

export interface EmailJobData extends EmailOptions {
  type: string;
  userId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

class EmailService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private templatesPath = path.join(__dirname, '../templates/emails');

  /**
   * Compile and cache email template
   */
  private compileTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!;
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateSource);
      this.templates.set(templateName, compiled);
      return compiled;
    } catch (error) {
      logger.error(`Failed to compile email template: ${templateName}`, { error });
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Render email template with context
   */
  private renderTemplate(templateName: string, context: Record<string, any>): string {
    const template = this.compileTemplate(templateName);
    return template(context);
  }

  /**
   * Send email directly (synchronous)
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = createEmailTransporter();

      let html = options.html;
      if (options.template && options.context) {
        html = this.renderTemplate(options.template, options.context);
      }

      const mailOptions = {
        from: emailConfig.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text: options.text,
        attachments: options.attachments,
        replyTo: emailConfig.replyTo,
      };

      const result = await transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error,
      });
      throw error;
    }
  }

  /**
   * Queue email for asynchronous processing
   */
  async queueEmail(data: EmailJobData): Promise<void> {
    try {
      // Create email log record
      const emailLog = await prisma.emailLog.create({
        data: {
          emailType: data.type as any,
          recipientEmail: Array.isArray(data.to) ? data.to[0] : data.to,
          recipientName: data.context?.fullName || data.context?.customerName || null,
          subject: data.subject,
          status: 'PENDING',
          userId: data.userId,
          templateData: data.context as any,
        },
      });

      // Add to queue
      await emailQueue.add(
        {
          ...data,
          emailLogId: emailLog.id,
        },
        {
          attempts: emailConfig.retries,
          backoff: {
            type: 'exponential',
            delay: emailConfig.retryDelay,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      logger.info('Email queued successfully', {
        emailLogId: emailLog.id,
        type: data.type,
        to: data.to,
      });
    } catch (error) {
      logger.error('Failed to queue email', {
        type: data.type,
        to: data.to,
        error,
      });
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: { email: string; fullName: string }): Promise<void> {
    try {
      await this.queueEmail({
        type: 'WELCOME',
        to: user.email,
        subject: 'Welcome to Ladoo Business!',
        template: 'welcome',
        context: {
          fullName: user.fullName,
          email: user.email,
          appUrl: process.env.APP_URL || 'http://localhost:3000',
        },
        userId: undefined,
        metadata: {
          userName: user.fullName,
        },
      });
    } catch (error) {
      logger.error('Failed to send welcome email', { user: user.email, error });
      // Don't throw - email failure shouldn't block registration
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(order: any): Promise<void> {
    try {
      await this.queueEmail({
        type: 'ORDER_CONFIRMATION',
        to: order.user.email,
        subject: `Order Confirmation - #${order.orderNumber}`,
        template: 'order-confirmation',
        context: {
          customerName: order.user.fullName,
          orderNumber: order.orderNumber,
          orderDate: new Date(order.createdAt).toLocaleDateString(),
          paymentMethod: order.paymentMethod,
          items: order.items.map((item: any) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price.toFixed(2),
          })),
          totalAmount: order.totalAmount.toFixed(2),
          shippingAddress: order.shippingAddress,
          trackingUrl: `${process.env.APP_URL}/orders/${order.id}`,
        },
        userId: order.userId,
        orderId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount.toString(),
        },
      });
    } catch (error) {
      logger.error('Failed to send order confirmation email', { orderId: order.id, error });
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdateEmail(order: any, newStatus: string): Promise<void> {
    try {
      const statusMessages: Record<string, string> = {
        CONFIRMED: 'Your order has been confirmed and is being prepared for shipment.',
        PROCESSING: 'Your order is currently being processed in our warehouse.',
        SHIPPED: 'Great news! Your order has been shipped and is on its way to you.',
        DELIVERED: 'Your order has been successfully delivered. Enjoy your purchase!',
        CANCELLED: 'Your order has been cancelled as requested.',
      };

      await this.queueEmail({
        type: 'ORDER_STATUS_UPDATE',
        to: order.user.email,
        subject: `Order Status Update - #${order.orderNumber}`,
        template: 'order-status-update',
        context: {
          customerName: order.user.fullName,
          orderNumber: order.orderNumber,
          newStatus,
          updatedDate: new Date().toLocaleDateString(),
          statusMessage: statusMessages[newStatus] || 'Your order status has been updated.',
          trackingNumber: order.trackingNumber,
          trackingUrl: `${process.env.APP_URL}/orders/${order.id}`,
        },
        userId: order.userId,
        orderId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          previousStatus: order.status,
          newStatus,
        },
      });
    } catch (error) {
      logger.error('Failed to send order status update email', { orderId: order.id, error });
    }
  }

  /**
   * Send order delivered email
   */
  async sendOrderDeliveredEmail(order: any): Promise<void> {
    try {
      await this.queueEmail({
        type: 'ORDER_DELIVERED',
        to: order.user.email,
        subject: `Order Delivered - #${order.orderNumber}`,
        template: 'order-delivered',
        context: {
          customerName: order.user.fullName,
          orderNumber: order.orderNumber,
          deliveredDate: new Date().toLocaleDateString(),
          reviewUrl: `${process.env.APP_URL}/orders/${order.id}/review`,
        },
        userId: order.userId,
        orderId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
        },
      });
    } catch (error) {
      logger.error('Failed to send order delivered email', { orderId: order.id, error });
    }
  }

  /**
   * Send order cancelled email
   */
  async sendOrderCancelledEmail(order: any, reason?: string): Promise<void> {
    try {
      await this.queueEmail({
        type: 'ORDER_CANCELLED',
        to: order.user.email,
        subject: `Order Cancelled - #${order.orderNumber}`,
        template: 'order-cancelled',
        context: {
          customerName: order.user.fullName,
          orderNumber: order.orderNumber,
          cancelledDate: new Date().toLocaleDateString(),
          refundAmount: order.totalAmount.toFixed(2),
          cancellationReason: reason || 'Your order has been cancelled.',
          shopUrl: `${process.env.APP_URL}/products`,
        },
        userId: order.userId,
        orderId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          refundAmount: order.totalAmount.toString(),
          reason,
        },
      });
    } catch (error) {
      logger.error('Failed to send order cancelled email', { orderId: order.id, error });
    }
  }

  /**
   * Update email log status
   */
  async updateEmailLog(emailLogId: string, status: string, error?: string): Promise<void> {
    try {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: status as any,
          sentAt: status === 'SENT' ? new Date() : undefined,
          errorMessage: error,
          retryCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to update email log', { emailLogId, error });
    }
  }
}

export const emailService = new EmailService();
