export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox';

/** Single field in a form; options required when type is 'select'. */
export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; /* only when type is 'select' */
}

/** Schema returned by the AI and used by FormPreview and code-generator. */
export interface FormSchema {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
}
