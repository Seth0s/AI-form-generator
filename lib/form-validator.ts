import { FormSchema } from '@/types/form';

/**
 * Validates an imported form schema: must be object, have fields array, each field with id/label/type.
 */
export function validateFormSchema(schema: unknown): { isValid: boolean; error?: string } {
  if (!schema || typeof schema !== 'object') {
    return { isValid: false, error: 'Invalid JSON file: not a valid object' };
  }

  const formSchema = schema as Partial<FormSchema>;

  if (!formSchema.fields || !Array.isArray(formSchema.fields)) {
    return { isValid: false, error: 'Invalid JSON file: missing fields array' };
  }

  for (const field of formSchema.fields) {
    if (!field.id || !field.label || !field.type) {
      return { isValid: false, error: 'Invalid JSON file: missing required field properties' };
    }
  }

  return { isValid: true };
}
