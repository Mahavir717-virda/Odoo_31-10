/**
 * Parses pagination from query params
 * @param {object} query
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query = {}) => {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > 100) {
    limit = 100;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Builds metadata object for paginated response
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 */
const buildMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  parsePagination,
  buildMeta,
};
