const ApiError = require('../utils/ApiError');

/**
 * Middleware factory to restrict access to specific roles
 * @param  {...string} roles
 */
const allow = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: You do not have permission to perform this action'));
    }
    next();
  };
};

module.exports = {
  allow,
};
