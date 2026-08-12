const orderService = require('../services/orderService');
const { ok, created } = require('../utils/response');
const { buildMeta } = require('../utils/paginate');
const asyncHandler = require('../utils/asyncHandler');

const checkout = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body, { ip: req.ip });
  return created(res, order);
});

const list = asyncHandler(async (req, res) => {
  const result = await orderService.listUserOrders(req.user.id, req.query);
  return ok(res, result.rows, buildMeta(result.count, result.page, result.limit));
});

const detail = asyncHandler(async (req, res) => {
  const order = await orderService.getUserOrder(req.user.id, req.params.orderId);
  return ok(res, order);
});

const count = asyncHandler(async (req, res) => {
  const count = await orderService.countOrders();
  return ok(res, { count });
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.orderId);
  return ok(res, order);
});

module.exports = { checkout, list, detail, count, cancel };
