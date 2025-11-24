import nodemailer, { Transporter } from 'nodemailer';

const isEmailEnabled = (process.env.EMAIL_ENABLED || 'true').toLowerCase() !== 'false';

const smtpConfig = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: (process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true',
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};

let transporter: Transporter | null = null;

if (isEmailEnabled && smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
  transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });
} else if (isEmailEnabled) {
  console.warn(
    'Email notifications are enabled but SMTP credentials are missing. Emails will be skipped.'
  );
}

export interface SendEmailOptions {
  to: string[] | string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  async sendMail(options: SendEmailOptions) {
    if (!isEmailEnabled) {
      console.info(
        `[Email] EMAIL_ENABLED=false. Skip sending email with subject: ${options.subject}`
      );
      return;
    }

    if (!transporter) {
      console.info(
        `[Email] SMTP transporter not configured. Skip sending email with subject: ${options.subject}`
      );
      return;
    }

    const recipients = Array.isArray(options.to) ? options.to.filter(Boolean) : [options.to];
    if (recipients.length === 0) {
      console.info('[Email] No recipients specified for notification email.');
      return;
    }

    await transporter.sendMail({
      from: smtpConfig.from,
      to: recipients.join(','),
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  },
};


