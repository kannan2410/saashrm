import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!env.smtp.user || !env.smtp.pass) {
    console.log('--- DEV EMAIL (no SMTP credentials configured) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('--- END DEV EMAIL ---');
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });
}
