const crypto = require('crypto');
const { models } = require('../models');
const ApiError = require('../utils/ApiError');
const tokenUtils = require('../utils/token');
const logger = require('../logger');
const mailer = require('./mailer');

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

async function issueVerification(user) {
  const raw = crypto.randomBytes(32).toString('hex');
  await models.EmailVerification.create({
    userId: user.id,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  });
  mailer.sendEmailVerification(user, raw).catch((err) => logger.warn(`verification mail failed: ${err.message}`));
}

async function register({ email, firstName, lastName, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const exists = await models.User.findOne({ where: { email: normalizedEmail } });
  if (exists) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await models.User.create({
    email: normalizedEmail,
    firstName,
    lastName,
    passwordHash: password,
    roleId: 3,
    emailVerifiedAt: null,
  });
  await models.Profile.create({ userId: user.id, locale: 'en' });

  await issueVerification(user);

  mailer.sendWelcome(user).catch((err) => logger.warn(`welcome mail failed: ${err.message}`));

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: 'customer',
    emailVerified: false,
  };
}

async function verifyEmail(rawToken) {
  const record = await models.EmailVerification.findOne({ where: { tokenHash: hashToken(rawToken) } });
  if (!record) throw ApiError.badRequest('Invalid or expired verification link');
  if (record.usedAt) throw ApiError.badRequest('This verification link has already been used');
  if (record.expiresAt.getTime() < Date.now()) throw ApiError.badRequest('This verification link has expired');

  const user = await models.User.findByPk(record.userId);
  if (!user) throw ApiError.badRequest('Invalid or expired verification link');

  user.emailVerifiedAt = new Date();
  await user.save();

  record.usedAt = new Date();
  await record.save();

  return { ok: true, emailVerified: true };
}

async function resendVerification({ email }) {
  const user = await models.User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    return { ok: true };
  }
  if (user.emailVerifiedAt) {
    return { ok: true, alreadyVerified: true };
  }

  await models.EmailVerification.update(
    { usedAt: new Date() },
    { where: { userId: user.id, usedAt: null } }
  );
  await issueVerification(user);

  return { ok: true };
}

async function login({ email, password }) {
  const user = await models.User.unscoped().findOne({
    where: { email: String(email).trim().toLowerCase() },
    include: [
      { model: models.Role, as: 'role' },
      { model: models.Profile, as: 'profile' },
    ],
  });

  if (!user) throw ApiError.unauthorized('Invalid email or password');
  const valid = await user.verifyPassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');
  if (user.status !== 'active') {
    throw ApiError.forbidden('This account has been disabled');
  }

  if (user.profile) {
    user.profile.lastLoginAt = new Date();
    await user.profile.save();
  }

  const roleName = user.role ? user.role.name : 'customer';
  const accessToken = tokenUtils.signAccessToken({ id: user.id, roleName });
  const refreshToken = tokenUtils.signRefreshToken({ id: user.id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: roleName,
      emailVerified: Boolean(user.emailVerifiedAt),
    },
  };
}

async function refresh(refreshToken) {
  const payload = tokenUtils.verifyToken(refreshToken);
  if (payload.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await models.User.findByPk(payload.sub, { include: [{ model: models.Role, as: 'role' }] });
  if (!user) throw ApiError.unauthorized('Invalid refresh token');
  if (user.status !== 'active') throw ApiError.forbidden('This account has been disabled');

  const roleName = user.role ? user.role.name : 'customer';
  return {
    accessToken: tokenUtils.signAccessToken({ id: user.id, roleName }),
    refreshToken: tokenUtils.signRefreshToken({ id: user.id }),
  };
}

async function logout(refreshToken) {
  // Nothing to invalidate server-side yet; clients should discard the token.
  return { ok: true };
}

async function forgotPassword({ email }) {
  const user = await models.User.findOne({ where: { email } });
  if (!user) {
    return { ok: true };
  }

  const raw = crypto.randomBytes(32).toString('hex');
  await models.PasswordReset.create({
    userId: user.id,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  mailer.sendPasswordReset(user, raw).catch((err) => logger.warn(`reset mail failed: ${err.message}`));
  return { ok: true };
}

async function resetPassword({ token, password }) {
  const record = await models.PasswordReset.findOne({ where: { tokenHash: hashToken(token) } });
  if (!record) throw ApiError.badRequest('Invalid or expired reset token');
  if (record.usedAt) throw ApiError.badRequest('This reset link has already been used');
  if (record.expiresAt.getTime() < Date.now()) throw ApiError.badRequest('This reset link has expired');

  const user = await models.User.findByPk(record.userId);
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.passwordHash = password;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  return { ok: true };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
