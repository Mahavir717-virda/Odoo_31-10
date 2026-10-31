const paymentsService = require('./payments.service');
const { ok } = require('../../utils/response');

const recordPayment = async (req, res) => {
  const result = await paymentsService.recordPayment(req.body, req.user.id);
  return ok(res, result, 'Payment recorded successfully', undefined, 201);
};

const listPayments = async (req, res) => {
  const { payments, meta } = await paymentsService.listPayments(req.query);
  return ok(res, payments, 'Payments retrieved successfully', meta);
};

const listInvoicePayments = async (req, res) => {
  const payments = await paymentsService.listInvoicePayments(Number(req.params.id), req.user);
  return ok(res, payments, 'Invoice payments retrieved successfully');
};

module.exports = {
  recordPayment,
  listPayments,
  listInvoicePayments,
};

