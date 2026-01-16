export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Only for 'select' type
}

export interface FormSchema {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
}
