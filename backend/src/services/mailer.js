const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../logger');

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: false,
  ...(config.mail.user ? { auth: { user: config.mail.user, pass: config.mail.pass } } : {}),
});

function send({ to, subject, html }) {
  if (config.mail.preview) {
    logger.info(`[mail preview] to=${to} subject="${subject}"`);
    return Promise.resolve({ preview: true, to, subject });
  }
  return transporter.sendMail({ from: config.mail.from, to, subject, html });
}

const mailer = {
  sendWelcome(user) {
    return send({
      to: user.email,
      subject: 'Welcome to ShopFlow',
      html: `<p>Hi ${user.firstName}, thanks for joining ShopFlow.</p><p>Use code <strong>WELCOME10</strong> for 10% off your first order.</p>`,
    });
  },

  sendEmailVerification(user, token) {
    const link = `${config.webBaseUrl}/verify?token=${token}`;
    return send({
      to: user.email,
      subject: 'Verify your ShopFlow email',
      html: `<p>Hi ${user.firstName},</p><p>Confirm your email address to enable checkout:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
    });
  },

  sendPasswordReset(user, token) {
    const link = `${config.webBaseUrl}/reset-password?token=${token}`;
    return send({
      to: user.email,
      subject: 'Reset your ShopFlow password',
      html: `<p>Hi ${user.firstName},</p><p>Click the link below to reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 60 minutes.</p>`,
    });
  },

  sendOrderConfirmation(user, order) {
    return send({
      to: user.email,
      subject: `Order ${order.orderNumber} confirmed`,
      html: `<p>Hi ${user.firstName}, thanks for your order ${order.orderNumber}. We are preparing your shipment.</p>`,
    });
  },
};

module.exports = mailer;
