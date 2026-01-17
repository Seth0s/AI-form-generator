'use client';

import { useForm, Controller, Control, FieldErrors } from 'react-hook-form';
import { FormSchema, FormField } from '@/types/form';
import jsPDF from 'jspdf';

interface FormPreviewProps {
  schema: FormSchema;
}

interface FormData {
  [key: string]: string | number | boolean | string[] | undefined;
}

interface JSPDFInternal {
  pages: { length: number };
}

export default function FormPreview({ schema }: FormPreviewProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: schema.fields.reduce((acc, field) => {
      acc[field.id] = field.type === 'checkbox' ? false : '';
      return acc;
    }, {} as FormData),
  });

  const generatePDF = (data: FormData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Header - Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(schema.formTitle, margin, yPosition);
    yPosition += 10;

    // Header - Description
    if (schema.formDescription) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const descriptionLines = doc.splitTextToSize(
        schema.formDescription,
        pageWidth - 2 * margin
      );
      doc.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 6 + 5;
    }

    // Add a line separator
    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Body - Form fields and answers
    doc.setFontSize(11);
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 15;
    
    schema.fields.forEach((field) => {
      const value = data[field.id];

      // Check if we need a new page (leave space for footer)
      if (yPosition > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
      }

      // Label (Question) in bold
      doc.setFont('helvetica', 'bold');
      const labelText = `${field.label}${field.required ? ' *' : ''}`;
      doc.text(labelText, margin, yPosition);
      yPosition += 7;

      // Value (Answer) in normal text
      doc.setFont('helvetica', 'normal');
      let answerText = '';

      if (field.type === 'checkbox') {
        answerText = value ? 'Yes' : 'No';
      } else if (field.type === 'select' && !value) {
        answerText = 'Not selected';
      } else if (!value || value === '') {
        answerText = 'Not provided';
      } else {
        answerText = String(value);
      }

      // Handle long text by splitting into multiple lines
      const answerLines = doc.splitTextToSize(
        answerText,
        pageWidth - 2 * margin
      );
      doc.text(answerLines, margin, yPosition);
      yPosition += answerLines.length * 5 + 8; // Add spacing between questions
    });

    // Footer - Timestamp (add to all pages)
    const totalPages = (doc as unknown as { internal: JSPDFInternal }).internal.pages.length || 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const timestamp = `Generated on ${new Date().toLocaleString()}`;
      const footerY = pageHeight - 10;
      doc.text(timestamp, margin, footerY);
    }

    // Save the PDF
    const fileName = `${schema.formTitle.replace(/[^a-zA-Z0-9]/g, '-')}-filled.pdf`;
    doc.save(fileName);
  };

  const onSubmit = (data: FormData) => {
    generatePDF(data);
  };

  const renderField = (field: FormField, control: Control<FormData>, errors: FieldErrors<FormData>) => {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={{
          required: field.required
            ? `${field.label} is required`
            : false,
        }}
        render={({ field: formField }) => {
          const fieldError = errors[field.id];

          switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
              return (
                <div>
                  <input
                    type={field.type}
                    {...formField}
                    value={String(formField.value || '')}
                    placeholder={field.placeholder}
                    className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {fieldError && (
                    <p className="text-sm text-red-600 mt-1">
                      {fieldError.message}
                    </p>
                  )}
                </div>
              );

            case 'textarea':
              return (
                <div>
                  <textarea
                    {...formField}
                    value={String(formField.value || '')}
                    placeholder={field.placeholder}
                    rows={4}
                    className="min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  />
                  {fieldError && (
                    <p className="text-sm text-red-600 mt-1">
                      {fieldError.message}
                    </p>
                  )}
                </div>
              );

            case 'select':
              return (
                <div>
                  <select
                    {...formField}
                    value={String(formField.value || '')}
                    className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select an option...</option>
                    {field.options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {fieldError && (
                    <p className="text-sm text-red-600 mt-1">
                      {fieldError.message}
                    </p>
                  )}
                </div>
              );

            case 'checkbox':
              return (
                <div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={typeof formField.value === 'boolean' ? formField.value : false}
                      onChange={(e) => formField.onChange(e.target.checked)}
                      onBlur={formField.onBlur}
                      name={formField.name}
                      ref={formField.ref}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
                    />
                    <label
                      htmlFor={field.id}
                      className="text-sm font-medium text-gray-900"
                    >
                      {field.placeholder || field.label}
                    </label>
                  </div>
                  {fieldError && (
                    <p className="text-sm text-red-600 mt-1">
                      {fieldError.message}
                    </p>
                  )}
                </div>
              );

            default:
              return <div>Unknown field type: {field.type}</div>;
          }
        }}
      />
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-8">
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {schema.formTitle}
        </h2>
        {schema.formDescription && (
          <p className="text-gray-500">
            {schema.formDescription}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {schema.fields.map((field) => (
          <div key={field.id} className="space-y-2">
          {field.type !== 'checkbox' && (
            <label
              htmlFor={field.id}
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              {field.label}
              {field.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
          )}
            {renderField(field, control, errors)}
          </div>
        ))}

        <div className="pt-6">
          <button
            type="submit"
            className="w-full h-12 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Generate PDF
          </button>
        </div>
      </form>
    </div>
  );
}
