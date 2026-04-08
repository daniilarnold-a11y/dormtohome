const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.APP_URL || 'http://localhost:10000'}/verify/${token}`;
  
  await transporter.sendMail({
    from: '"DormToHome" <noreply@dormtohome.com>',
    to: email,
    subject: 'Verify your DormToHome account',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0B1D3A;">Welcome to DormToHome!</h2>
        <p>Please verify your email address to activate your account.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #C9962D; color: #0B1D3A; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verify Email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy this link: ${verifyUrl}
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  });
}

async function sendWelcomeEmail(email, firstName) {
  await transporter.sendMail({
    from: '"DormToHome" <noreply@dormtohome.com>',
    to: email,
    subject: 'Welcome to DormToHome!',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0B1D3A;">Welcome, ${firstName}!</h2>
        <p>Your account has been verified. You can now book rides and track your bus in real-time.</p>
        <p style="color: #666;">Start by browsing available routes on the app.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };