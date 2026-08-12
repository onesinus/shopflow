const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function buildPagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildMeta(count, page, limit) {
  const totalPages = count === 0 ? 0 : Math.ceil(count / limit);
  return {
    page,
    limit,
    total: count,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { buildPagination, buildMeta, DEFAULT_LIMIT, MAX_LIMIT };
