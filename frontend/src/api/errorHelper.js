/**
 * Extracts and normalizes field-level validation errors from an API error response.
 * Compatible with backend's validation middleware format: { success: false, message: string, errors: [{ field, message }] }
 * Also handles fallback error patterns.
 */
export function extractValidationErrors(err) {
  const fieldErrors = {};
  const responseData = err?.data || err?.response?.data || err?.originalError?.response?.data;

  if (Array.isArray(responseData?.errors)) {
    responseData.errors.forEach((e) => {
      if (e?.field && e?.message) {
        fieldErrors[e.field] = e.message;
      }
    });
  } else if (responseData?.errors && typeof responseData.errors === 'object') {
    Object.assign(fieldErrors, responseData.errors);
  }

  const generalMessage =
    responseData?.message ||
    err?.message ||
    'Operation failed. Please review the highlighted fields.';

  return { fieldErrors, generalMessage };
}

