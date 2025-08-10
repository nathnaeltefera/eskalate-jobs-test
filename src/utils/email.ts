import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Talent Team <noreply@yourdomain.com>',
    to: email,
    subject: 'Email Verification - Talent Management System',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p>Thank you for registering with our Talent Management System!</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't register for this account, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this URL into your browser:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendApplicationNotification = async (
  companyEmail: string,
  jobTitle: string,
  applicantName: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Talent Team <noreply@yourdomain.com>',
    to: companyEmail,
    subject: `New Application Received - ${jobTitle}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">New Job Application</h2>
        <p>You have received a new application for the position: <strong>${jobTitle}</strong></p>
        <p><strong>Applicant:</strong> ${applicantName}</p>
        <p>Please log in to your dashboard to review the application and resume.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Applications
          </a>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendStatusUpdateEmail = async (
  applicantEmail: string,
  jobTitle: string,
  status: string
): Promise<void> => {
  let subject = '';
  let message = '';
  let color = '#007bff';

  switch (status) {
    case 'Interview':
      subject = `Interview Invitation - ${jobTitle}`;
      message = "You've been selected for an interview! We're excited to learn more about you.";
      color = '#28a745';
      break;
    case 'Rejected':
      subject = `Application Update - ${jobTitle}`;
      message = "We regret to inform you that we won't be moving forward with your application at this time. Thank you for your interest in our company.";
      color = '#dc3545';
      break;
    case 'Hired':
      subject = `Congratulations - ${jobTitle}`;
      message = "Congratulations! You've been hired. Welcome to the team!";
      color = '#28a745';
      break;
    default:
      return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Talent Team <noreply@yourdomain.com>',
    to: applicantEmail,
    subject,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: ${color}; text-align: center;">Application Status Update</h2>
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p>${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL}" 
             style="background-color: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Application
          </a>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};