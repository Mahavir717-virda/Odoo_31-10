const reportsService = require('./reports.service');
const { ok } = require('../../utils/response');

const getSummary = async (req, res) => {
  const summary = await reportsService.getSummary(req.query);
  return ok(res, summary, 'Summary report retrieved successfully');
};

const getOverdue = async (req, res) => {
  const { overdue, meta } = await reportsService.getOverdue(req.query);
  return ok(res, overdue, 'Overdue report retrieved successfully', meta);
};

const getRevenue = async (req, res) => {
  const revenue = await reportsService.getRevenue(req.query);
  return ok(res, revenue, 'Revenue report retrieved successfully');
};

module.exports = {
  getSummary,
  getOverdue,
  getRevenue,
};

