const { models } = require('../models');
const ApiError = require('../utils/ApiError');

module.exports = async function requireVerifiedEmail(req, res, next) {
  try {
    const user = await models.User.findByPk(req.user.id);
    if (!user || !user.emailVerifiedAt) {
      return next(ApiError.forbidden('Please verify your email address before checking out'));
    }
    return next();
  } catch (err) {
    return next(err);
  }
};