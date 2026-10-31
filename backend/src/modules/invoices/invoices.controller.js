const invoicesService = require('./invoices.service');
const { renderInvoicePrintHtml } = require('./invoices.print');
const { ok } = require('../../utils/response');

const generateDueInvoices = async (req, res) => {
  const result = await invoicesService.generateDue();
  return ok(res, result, 'Due invoices processed successfully');
};

const listInvoices = async (req, res) => {
  const { invoices, meta } = await invoicesService.listInvoices(req.query, req.user);
  return ok(res, invoices, 'Invoices retrieved successfully', meta);
};

const getInvoiceById = async (req, res) => {
  const invoice = await invoicesService.getInvoiceById(Number(req.params.id), req.user);
  return ok(res, invoice, 'Invoice retrieved successfully');
};

const confirmInvoice = async (req, res) => {
  const invoice = await invoicesService.confirmInvoice(Number(req.params.id));
  return ok(res, invoice, 'Invoice confirmed successfully');
};

const cancelInvoice = async (req, res) => {
  const invoice = await invoicesService.cancelInvoice(Number(req.params.id));
  return ok(res, invoice, 'Invoice cancelled successfully');
};

const sendInvoice = async (req, res) => {
  const invoice = await invoicesService.sendInvoice(Number(req.params.id));
  return ok(res, invoice, 'Invoice sent successfully');
};

const printInvoice = async (req, res) => {
  const invoice = await invoicesService.getInvoiceById(Number(req.params.id), req.user);
  const html = renderInvoicePrintHtml(invoice);
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};

module.exports = {
  generateDueInvoices,
  listInvoices,
  getInvoiceById,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  printInvoice,
};

