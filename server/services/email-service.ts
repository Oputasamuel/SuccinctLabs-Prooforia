import { MailService } from '@sendgrid/mail';

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private mailService: MailService;
  private fromEmail = 'noreply@sp1mint.com'; // Use your verified domain

  constructor() {
    this.mailService = new MailService();
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`[DEV MODE] Password reset code for ${email}: ${code}`);
      return true; // Return success in development mode
    }

    try {
      await this.mailService.send({
        to: email,
        from: this.fromEmail,
        subject: 'SP1Mint - Password Reset Code',
        text: `Your password reset code is: ${code}. This code will expire in 15 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FE11C5;">SP1Mint - Password Reset</h2>
            <p>You requested a password reset for your SP1Mint account.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #333;">${code}</h3>
            </div>
            <p>Enter this code on the password reset page to continue.</p>
            <p><strong>This code will expire in 15 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">SP1Mint - Zero-Knowledge NFT Platform</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`[DEV MODE] Email to ${params.to}: ${params.subject}`);
      return true;
    }

    try {
      await this.mailService.send({
        to: params.to,
        from: this.fromEmail,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();