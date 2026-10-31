const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');
const validate = require('../../middleware/validate');

const templatesController = require('./templates.controller');
const {
  createTemplateSchema,
  updateTemplateSchema,
  listTemplatesQuerySchema,
} = require('./templates.validation');

// Quotation templates are accessible to ADMIN and STAFF
router.use('/quotation-templates', auth, allow('ADMIN', 'STAFF'));

router.get(
  '/quotation-templates',
  validate(listTemplatesQuerySchema, 'query'),
  templatesController.listTemplates
);

router.get(
  '/quotation-templates/:id',
  templatesController.getTemplateById
);

router.post(
  '/quotation-templates',
  validate(createTemplateSchema, 'body'),
  templatesController.createTemplate
);

router.put(
  '/quotation-templates/:id',
  validate(updateTemplateSchema, 'body'),
  templatesController.updateTemplate
);

router.delete(
  '/quotation-templates/:id',
  templatesController.deleteTemplate
);

module.exports = router;

