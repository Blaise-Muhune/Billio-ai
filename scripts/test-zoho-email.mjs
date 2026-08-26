import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const recipients = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['blaisemu007@gmail.com', 'muyumba@andrews.edu'];

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.verify();
  console.log('SMTP_OK', process.env.EMAIL_HOST, process.env.EMAIL_USER);

  const stamp = new Date().toISOString();
  for (const to of recipients) {
    const info = await transporter.sendMail({
      from: `BilloAI <${process.env.EMAIL_USER}>`,
      to,
      subject: 'BilloAI Zoho SMTP test',
      text: `Zoho SMTP test at ${stamp}. If you got this, email works.`,
      html: `<p>Zoho SMTP test from BilloAI at <b>${stamp}</b>.</p><p>If you got this, email works.</p>`
    });
    console.log('SENT', to, info.messageId);
  }
}

main().catch((err) => {
  console.error('FAIL', err.message);
  process.exit(1);
});
