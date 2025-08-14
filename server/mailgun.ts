
import Mailgun from 'mailgun.js';
import formData from 'form-data';

class MailgunService {
  private mg: any;
  private domain: string;

  constructor() {
    const mailgun = new Mailgun(formData);
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY!,
    });
    this.domain = process.env.MAILGUN_DOMAIN!;
  }

  async sendBookingConfirmation(
    to: string,
    customerName: string,
    appointmentDetails: {
      title: string;
      date: string;
      time: string;
      location?: string;
      description?: string;
    }
  ) {
    const subject = 'Booking Confirmation - Thank You!';
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Thank You for Your Booking!</h2>
            
            <p>Dear ${customerName},</p>
            
            <p>Thank you for booking with us! Your appointment has been confirmed.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Appointment Details:</h3>
              <p><strong>Service:</strong> ${appointmentDetails.title}</p>
              <p><strong>Date:</strong> ${appointmentDetails.date}</p>
              <p><strong>Time:</strong> ${appointmentDetails.time}</p>
              ${appointmentDetails.location ? `<p><strong>Location:</strong> ${appointmentDetails.location}</p>` : ''}
              ${appointmentDetails.description ? `<p><strong>Notes:</strong> ${appointmentDetails.description}</p>` : ''}
            </div>
            
            <p>We look forward to seeing you! If you need to make any changes or have questions, please contact us.</p>
            
            <p>Best regards,<br>The FieldFlow Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Thank You for Your Booking!
      
      Dear ${customerName},
      
      Thank you for booking with us! Your appointment has been confirmed.
      
      Appointment Details:
      Service: ${appointmentDetails.title}
      Date: ${appointmentDetails.date}
      Time: ${appointmentDetails.time}
      ${appointmentDetails.location ? `Location: ${appointmentDetails.location}` : ''}
      ${appointmentDetails.description ? `Notes: ${appointmentDetails.description}` : ''}
      
      We look forward to seeing you! If you need to make any changes or have questions, please contact us.
      
      Best regards,
      The FieldFlow Team
    `;

    try {
      const result = await this.mg.messages.create(this.domain, {
        from: `FieldFlow <noreply@${this.domain}>`,
        to: [to],
        subject,
        text,
        html,
      });

      console.log('Booking confirmation email sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw error;
    }
  }

  async sendReminder(
    to: string,
    customerName: string,
    appointmentDetails: {
      title: string;
      date: string;
      time: string;
      location?: string;
    }
  ) {
    const subject = 'Appointment Reminder';
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2196F3;">Appointment Reminder</h2>
            
            <p>Dear ${customerName},</p>
            
            <p>This is a friendly reminder about your upcoming appointment.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Appointment Details:</h3>
              <p><strong>Service:</strong> ${appointmentDetails.title}</p>
              <p><strong>Date:</strong> ${appointmentDetails.date}</p>
              <p><strong>Time:</strong> ${appointmentDetails.time}</p>
              ${appointmentDetails.location ? `<p><strong>Location:</strong> ${appointmentDetails.location}</p>` : ''}
            </div>
            
            <p>We look forward to seeing you! If you need to reschedule, please contact us as soon as possible.</p>
            
            <p>Best regards,<br>The FieldFlow Team</p>
          </div>
        </body>
      </html>
    `;

    try {
      const result = await this.mg.messages.create(this.domain, {
        from: `FieldFlow <noreply@${this.domain}>`,
        to: [to],
        subject,
        html,
      });

      console.log('Reminder email sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw error;
    }
  }
}

export const mailgunService = new MailgunService();
