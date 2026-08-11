const catalogService = require('../services/catalogService');
const productService = require('../services/productService');
const reviewService = require('../services/reviewService');
const { ok, created } = require('../utils/response');
const { buildMeta } = require('../utils/paginate');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await catalogService.listProducts(req.query);
  return ok(res, result.rows, buildMeta(result.count, result.page, result.limit));
});

const detail = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  if (!product) {
    return res.status(404).json({
      error: {
        message: 'Product not found',
      },
    });
  }

  return ok(res, product);
});

const bySlug = asyncHandler(async (req, res) => {
  const product = await catalogService.getProductBySlug(req.params.slug);
  if (!product) return res.status(200).json({ data: null });
  return ok(res, product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, { actorId: req.user.id, ip: req.ip });
  return created(res, product);
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, { actorId: req.user.id, ip: req.ip });
  return ok(res, product);
});

const remove = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, { actorId: req.user.id, ip: req.ip });
  return res.status(204).end();
});

const createVariant = asyncHandler(async (req, res) => {
  const variant = await productService.createVariant(req.params.id, req.body, { actorId: req.user.id, ip: req.ip });
  return created(res, variant);
});

const listReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.listByProduct(req.params.id, req.query);
  return ok(res, result.rows, {
    ...buildMeta(result.count, result.page, result.limit),
    aggregate: result.aggregate,
  });
});

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.create(req.user.id, req.params.id, req.body);
  return created(res, review);
});

module.exports = { list, detail, bySlug, create, update, remove, createVariant, listReviews, createReview };
