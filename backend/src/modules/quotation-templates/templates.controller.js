const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const templatesService = require('./templates.service');

const listTemplates = asyncHandler(async (req, res) => {
  const { templates, meta } = await templatesService.listTemplates(req.query);
  return ok(res, templates, 'Quotation templates retrieved successfully', meta);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const template = await templatesService.getTemplateById(req.params.id);
  return ok(res, template, 'Quotation template retrieved successfully');
});

const createTemplate = asyncHandler(async (req, res) => {
  const template = await templatesService.createTemplate(req.body, req.user.id);
  return ok(res, template, 'Quotation template created successfully', undefined, 201);
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await templatesService.updateTemplate(req.params.id, req.body);
  return ok(res, template, 'Quotation template updated successfully');
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await templatesService.deleteTemplate(req.params.id);
  return ok(res, result, result.message);
});

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};

