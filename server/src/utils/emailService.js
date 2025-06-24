import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", 
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendMail = async ({ to, subject, html }) => {
  console.log('Sending email to:', to);
  await transporter.sendMail({
    from: `"AnimeTrackerX" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}; 