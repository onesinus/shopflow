const router = require('express').Router();
const { body } = require('express-validator');
const { requireAuth, requireStaffOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const productController = require('../controllers/productController');

router.get('/', productController.list);
router.get('/slug/:slug', productController.bySlug);
router.get('/:id/reviews', productController.listReviews);
router.get('/:id', productController.detail);

router.post(
  '/',
  requireAuth,
  requireStaffOrAdmin,
  validate([
    body('sku').notEmpty().withMessage('SKU is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('priceCents').isInt({ min: 1 }).withMessage('priceCents must be a positive integer'),
    body('categoryId').optional().isInt(),
    body('featured').optional().isBoolean(),
  ]),
  productController.create
);

router.patch(
  '/:id',
  requireAuth,
  requireStaffOrAdmin,
  validate([
    body('priceCents').optional().isInt({ min: 1 }),
    body('featured').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
    body('imageUrl').optional().isURL({ require_protocol: false }).withMessage('imageUrl must be a valid URL'),
  ]),
  productController.update
);

router.delete('/:id', requireAuth, requireStaffOrAdmin, productController.remove);

router.post(
  '/:id/variants',
  requireAuth,
  requireStaffOrAdmin,
  validate([
    body('sku').notEmpty().withMessage('Variant SKU is required'),
    body('name').notEmpty().withMessage('Variant name is required'),
    body('priceCents').optional().isInt({ min: 1 }),
  ]),
  productController.createVariant
);

router.post(
  '/:id/reviews',
  requireAuth,
  validate([
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title').optional().isString().isLength({ max: 120 }),
    body('body').optional().isString(),
  ]),
  productController.createReview
);

module.exports = router;
