const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
// Safety cap for deep pagination - protects the API from expensive scans.
const MAX_OFFSET = 100;

function buildPagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.min((page - 1) * limit, MAX_OFFSET);
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
