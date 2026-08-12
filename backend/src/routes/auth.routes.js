const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

const emailRule = body('email')
  .notEmpty()
  .withMessage('Email is required')
  .isEmail()
  .withMessage('A valid email is required')
  .normalizeEmail();

const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters');

router.post(
  '/register',
  validate([
    emailRule,
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    passwordRule,
  ]),
  authController.register
);

router.post(
  '/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
  validate([
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

router.post(
  '/refresh',
  validate([body('refreshToken').notEmpty().withMessage('refreshToken is required')]),
  authController.refresh
);

router.post('/logout', authController.logout);

router.get('/verify/:token', authController.verifyEmail);

router.post(
  '/resend-verification',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }),
  validate([body('email').isEmail().withMessage('A valid email is required')]),
  authController.resendVerification
);

router.post(
  '/forgot-password',
  validate([body('email').isEmail().withMessage('A valid email is required')]),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    passwordRule,
  ]),
  authController.resetPassword
);

module.exports = router;
