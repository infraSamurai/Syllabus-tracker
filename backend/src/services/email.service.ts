import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendReportEmail(
    recipients: string[], 
    reportName: string, 
    reportData: Buffer, 
    fileName: string,
    format: string
  ) {
    const extension = format === 'excel' ? 'xlsx' : format;
    const contentType = this.getContentType(format);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Syllabus Tracker <noreply@syllabustrack.com>',
      to: recipients.join(', '),
      subject: `${reportName} - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">${reportName}</h2>
          <p>Please find attached your scheduled report generated on ${new Date().toLocaleString()}.</p>
          <p style="color: #666; font-size: 14px;">This is an automated email. Please do not reply.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Powered by Syllabus Tracker - Akshararambh Public School
          </p>
        </div>
      `,
      attachments: [{
        filename: `${fileName}.${extension}`,
        content: reportData,
        contentType
      }]
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Report email sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send report email');
    }
  }

  async sendMilestoneNotification(userEmail: string, milestoneName: string, reward: any) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Syllabus Tracker <noreply@syllabustrack.com>',
      to: userEmail,
      subject: `🎉 Milestone Achieved: ${milestoneName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1 style="color: #667eea;">Congratulations! 🎉</h1>
          <h2>You've unlocked: ${milestoneName}</h2>
          <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <h3>Your Reward:</h3>
            <p style="font-size: 24px; color: #667eea;">
              ${reward.type === 'points' ? `${reward.value} Points` : 
                reward.type === 'badge' ? `${reward.value} Badge` : 
                'Certificate of Achievement'}
            </p>
          </div>
          <p>Keep up the great work!</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending milestone notification:', error);
    }
  }

  async sendDeadlineReminder(userEmail: string, topics: any[]) {
    const topicList = topics.map(t => 
      `<li>${t.title} - Due: ${new Date(t.deadline).toLocaleDateString()}</li>`
    ).join('');

    const mailOptions = {
      from: process.env.SMTP_FROM || 'Syllabus Tracker <noreply@syllabustrack.com>',
      to: userEmail,
      subject: `⏰ Deadline Reminder - ${topics.length} topics due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #f59e0b;">Deadline Reminder ⏰</h2>
          <p>The following topics have upcoming deadlines:</p>
          <ul style="line-height: 1.8;">
            ${topicList}
          </ul>
          <p style="margin-top: 20px;">
            <a href="${process.env.APP_URL}/tasks" 
               style="background: #667eea; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              View Tasks
            </a>
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
    }
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}

export const emailService = new EmailService(); 