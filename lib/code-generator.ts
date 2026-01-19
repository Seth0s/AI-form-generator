import { FormSchema, FormField } from '@/types/form';

/**
 * Generates JSX code string for a single form field based on its type.
 * Checkbox omits the top-level label (label sits next to the input).
 */
function generateFieldJSX(field: FormField): string {
  const labelJSX = field.type !== 'checkbox' 
    ? `          <label htmlFor="${field.id}" className="form-label">
            ${field.label}
            ${field.required ? '<span className="form-required">*</span>' : ''}
          </label>`
    : '';

  let fieldJSX = '';
  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      fieldJSX = `          <input
            type="${field.type}"
            id="${field.id}"
            name="${field.id}"
            ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
            ${field.required ? 'required' : ''}
            className="form-input"
          />`;
      break;
    case 'textarea':
      fieldJSX = `          <textarea
            id="${field.id}"
            name="${field.id}"
            ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
            ${field.required ? 'required' : ''}
            rows={4}
            className="form-textarea"
          />`;
      break;
    case 'select':
      const optionsJSX = field.options?.map(opt => `            <option value="${opt}">${opt}</option>`).join('\n') || '';
      fieldJSX = `          <select
            id="${field.id}"
            name="${field.id}"
            ${field.required ? 'required' : ''}
            className="form-select"
          >
            <option value="">Select an option...</option>
${optionsJSX}
          </select>`;
      break;
    case 'checkbox':
      fieldJSX = `          <div className="form-checkbox-container">
            <input
              type="checkbox"
              id="${field.id}"
              name="${field.id}"
              ${field.required ? 'required' : ''}
              className="form-checkbox"
            />
            <label htmlFor="${field.id}" className="form-checkbox-label">
              ${field.placeholder || field.label}
            </label>
          </div>`;
      break;
  }

  return field.type === 'checkbox' 
    ? fieldJSX
    : `${labelJSX}\n${fieldJSX}`;
}

/**
 * Generates a complete React component JSX string from a FormSchema.
 * Output uses form-container, form-header, form-input, etc.; user must copy styles/generated-form.css.
 */
export function generateFormComponentCode(schema: FormSchema): string {
  const fieldsJSX = schema.fields.map(field => generateFieldJSX(field)).join('\n\n');
  const componentName = schema.formTitle.replace(/[^a-zA-Z0-9]/g, ''); /* Safe for function name */

  const jsxCode = `import { FormEvent } from 'react';
import './generated-form.css';

export default function ${componentName}Form() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log('Form data:', data);
    // Add your form submission logic here
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>
          ${schema.formTitle}
        </h2>
        ${schema.formDescription ? `<p>
          ${schema.formDescription}
        </p>` : ''}
      </div>

      <form onSubmit={handleSubmit} className="form-form">
${fieldsJSX.split('\n').map(line => '        ' + line).join('\n')}

        <div className="form-submit-container">
          <button
            type="submit"
            className="form-submit-button"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

/*
 * Note: Make sure to copy the CSS file (styles/generated-form.css) to your project
 * or import it in your main CSS file.
 */`;

  return jsxCode;
}
