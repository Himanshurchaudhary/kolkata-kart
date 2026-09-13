const nodemailer  = require('nodemailer');
const MailSetting = require('../models/dependence/MailSetting');

const sendEmail = async (options) => {
    try {
        const config = await MailSetting.findOne({ status: true });
        if (!config) throw new Error('Mail configuration not found or is disabled.');

        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,      // smtp.hostinger.com
          port: parseInt(process.env.EMAIL_PORT),  // 465
          secure: true,                      // true for port 465
          auth: {
            user: process.env.EMAIL_USER,    // support@kolkatakart.in
            pass: process.env.EMAIL_PASS,    // Kolkatakart@04
          },
        });

        await transporter.sendMail({
            from:    `"Kolkata Kart" <${config.mailFromAddress}>`,
            to:      options.email,
            subject: options.subject,
            text:    options.message,
            ...(options.html ? { html: options.html } : {}),
        });

        console.log('✅ Email sent to:', options.email);
        return true;
    } catch (error) {
        console.error('❌ Email Error:', error.message);
        return false;
    }
};

module.exports = sendEmail;