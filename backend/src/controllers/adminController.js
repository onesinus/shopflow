const path = require('path');
const fs = require('fs');
const multer = require('multer');
const adminService = require('../services/adminService');
const userService = require('../services/userService');
const orderService = require('../services/orderService');
const productService = require('../services/productService');
const { ok } = require('../utils/response');
const { buildMeta } = require('../utils/paginate');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { models } = require('../models');

const uploadDir = path.resolve(__dirname, '../../public/uploads');

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const uploadProductImageMiddleware = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(ApiError.badRequest('Only image files are allowed'));
    }
    return cb(null, true);
  },
}).single('image');

const dashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  return ok(res, stats);
});

const salesReport = asyncHandler(async (req, res) => {
  const report = await adminService.getSalesReport(req.query);
  return ok(res, report);
});

const salesExport = asyncHandler(async (req, res) => {
  const csv = adminService.exportSalesReport();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
  return res.send(csv);
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return ok(res, result.rows, buildMeta(result.count, result.page, result.limit));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserDetail(req.params.userId);
  return ok(res, user);
});

const setUserRole = asyncHandler(async (req, res) => {
  const user = await userService.setUserRole(req.user.id, req.params.userId, req.body.roleId);
  return ok(res, user);
});

const listOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listAllOrders(req.query);
  return ok(res, result.rows, buildMeta(result.count, result.page, result.limit));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status, {
    actorId: req.user.id,
    ip: req.ip,
  });
  return ok(res, order);
});

const lowStock = asyncHandler(async (req, res) => {
  const result = await productService.listLowStock(req.query);
  return ok(res, result.rows, buildMeta(result.count, result.page, result.limit));
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await models.Coupon.create({
    code: String(req.body.code || '').toUpperCase(),
    description: req.body.description || null,
    discountType: req.body.discountType,
    discountValue: req.body.discountValue,
    minSubtotalCents: req.body.minSubtotalCents || 0,
    maxUses: req.body.maxUses || null,
    expiresAt: req.body.expiresAt || null,
    isActive: req.body.isActive !== false,
  });
  return res.status(201).json({ data: coupon });
});

const uploadProductImage = (req, res, next) => {
  uploadProductImageMiddleware(req, res, async (err) => {
    if (err) return next(err);
    try {
      const product = await models.Product.findByPk(req.params.productId);
      if (!product) throw ApiError.notFound('Product not found');
      if (!req.file) throw ApiError.badRequest('No image file provided');

      const imageUrl = `/uploads/${req.file.filename}`;
      await product.update({ imageUrl });

      return ok(res, product);
    } catch (uploadErr) {
      return next(uploadErr);
    }
  });
};

module.exports = {
  dashboardStats,
  salesReport,
  salesExport,
  listUsers,
  getUser,
  setUserRole,
  listOrders,
  updateOrderStatus,
  lowStock,
  createCoupon,
  uploadProductImage,
};
