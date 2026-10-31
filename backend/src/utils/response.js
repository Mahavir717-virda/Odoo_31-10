/**
 * Sends a standardized success response
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Success']
 * @param {object} [meta]
 * @param {number} [status=200]
 */
const ok = (res, data = null, message = 'Success', meta = undefined, status = 200) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
};

module.exports = {
  ok,
};

