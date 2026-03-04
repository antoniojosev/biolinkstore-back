import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    this.fromEmail = this.configService.get<string>('email.from') || 'noreply@biolinkstore.com';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      this.logger.warn('RESEND_API_KEY not configured - emails will be logged only');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (!this.resend) {
        this.logger.log(
          `[EMAIL MOCK] To: ${to}, Subject: ${subject}, HTML: ${html.substring(0, 100)}...`,
        );
        return true;
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return false;
      }

      this.logger.log(`Email sent successfully to ${to}: ${data?.id}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error sending email: ${error.message}`);
      return false;
    }
  }

  getFromEmail(): string {
    return this.fromEmail;
  }
}
