const router = require('express').Router();
const { body } = require('express-validator');
const { requireAuth, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const adminController = require('../controllers/adminController');

router.use(requireAuth);

router.get('/dashboard/stats', requireAdmin, adminController.dashboardStats);
router.get('/reports/sales', requireAdmin, adminController.salesReport);
router.get('/reports/sales/export', requireAdmin, adminController.salesExport);

router.get('/users', requireAdmin, adminController.listUsers);
router.get('/users/:userId', requireAdmin, adminController.getUser);
router.patch(
  '/users/:userId/role',
  requireAdmin,
  validate([body('roleId').isInt().withMessage('roleId must be an integer')]),
  adminController.setUserRole
);

router.get('/orders', requireStaffOrAdmin, adminController.listOrders);
router.patch(
  '/orders/:orderId/status',
  requireStaffOrAdmin,
  validate([body('status').notEmpty().withMessage('status is required')]),
  adminController.updateOrderStatus
);

router.get('/products/low-stock', requireStaffOrAdmin, adminController.lowStock);
router.post('/products/:productId/image', requireStaffOrAdmin, adminController.uploadProductImage);

router.post(
  '/coupons',
  requireAdmin,
  validate([
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('discountType').isIn(['percent', 'fixed']).withMessage('discountType must be percent or fixed'),
    body('discountValue').isInt({ min: 1 }).withMessage('discountValue must be a positive integer'),
  ]),
  adminController.createCoupon
);

module.exports = router;
