const promoService = require('../services/promoService');

const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await promoService.getPromos();
  return ok(res, result, { });
});

module.exports = { list };
