const router = require('express').Router();
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const { validate } = require('../middleware/validate');
const orderController = require('../controllers/orderController');

// Legacy contract: the partner dashboard still calls this without auth.
router.get('/count', orderController.count);

router.use(requireAuth);

router.post(
  '/',
  requireVerifiedEmail,
  validate([
    body('addressId').isInt().withMessage('addressId is required'),
    body('couponCode').optional().isString(),
    body('paymentMethod')
      .optional()
      .isIn(['card', 'paypal', 'bank_transfer', 'klarna'])
      .withMessage('Unsupported payment method'),
  ]),
  orderController.checkout
);

router.get('/', orderController.list);
router.get('/:orderId', orderController.detail);
router.post('/:orderId/cancel', orderController.cancel);

module.exports = router;
