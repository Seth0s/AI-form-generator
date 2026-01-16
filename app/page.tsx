'use client';

// External libraries
import { useState, useTransition, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Internal modules
import { FormSchema } from '@/types/form';
import { generateForm } from './actions';
import FormPreview from '@/components/form-preview';
import ActionsToolbar from '@/components/actions-toolbar';
import { generateFormComponentCode } from '@/lib/code-generator';
import { validateFormSchema } from '@/lib/form-validator';

// Styles
import homeStyles from '@/styles/home.module.css';
import componentStyles from '@/styles/components.module.css';

const EXAMPLE_DESCRIPTIONS = [
  'A contact form with name, email, subject, and message fields',
  'A job application form with personal info, work experience, and skills',
  'A survey form about product satisfaction with rating and feedback',
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles form generation from user prompt
   * Validates input, clears previous state, and triggers AI generation
   */
  const handleGenerate = () => {
    if (!prompt.trim()) {
      setError('Please enter a form description');
      return;
    }

    setError(null);
    setFormSchema(null);

    startTransition(async () => {
      const result = await generateForm(prompt);
      
      if (result.success) {
        setFormSchema(result.schema);
      } else {
        setError(result.error);
      }
    });
  };

  const handleReset = () => {
    setPrompt('');
    setFormSchema(null);
    setError(null);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setError(null);
  };

  /**
   * Exports the current form schema as a JSON file
   * Creates a downloadable blob and triggers browser download
   */
  const handleExport = () => {
    if (!formSchema) return;

    const jsonString = JSON.stringify(formSchema, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'form-schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('JSON exported successfully!');
  };

  /**
   * Triggers the hidden file input to open file picker
   */
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles file selection and imports form schema from JSON
   * Validates schema structure and required fields before importing
   * TODO: Consider using zod schema validation for more robust type checking
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importedSchema = JSON.parse(jsonString);

        const validation = validateFormSchema(importedSchema);
        if (!validation.isValid) {
          setError(validation.error || 'Invalid JSON file');
          return;
        }

        setFormSchema(importedSchema as FormSchema);
        setError(null);
        showToast('Form loaded successfully!');
      } catch (err) {
        setError('Failed to parse JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Generates React component code from form schema and copies to clipboard
   * Uses code generator utility to create JSX string
   */
  const handleCopyCode = () => {
    if (!formSchema) return;

    const jsxCode = generateFormComponentCode(formSchema);

    navigator.clipboard.writeText(jsxCode).then(() => {
      showToast('JSX code copied to clipboard!');
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  /**
   * Displays a temporary toast notification
   * TODO: Consider replacing with a toast library (e.g., sonner, react-hot-toast) for better UX and features
   */
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <main className={homeStyles.main}>
      <div className={homeStyles.contentWrapper}>
        <div className={homeStyles.header}>
          <h1 className={homeStyles.title}>
            AI Form Builder
          </h1>
          <p className={homeStyles.subtitle}>
            Describe your form in plain English and let AI generate it for you
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!formSchema && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={homeStyles.searchRow}>
                <div className={homeStyles.inputWrapper}>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Form for high school students..."
                    className={homeStyles.textarea}
                    rows={1}
                    disabled={isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (prompt.trim() && !isPending) {
                          handleGenerate();
                        }
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isPending || !prompt.trim()}
                  className={homeStyles.generateButton}
                >
                  {isPending ? (
                    <svg
                      className={homeStyles.spinner}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className={homeStyles.spinnerCircle}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className={homeStyles.spinnerPath}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    'Generate form'
                  )}
                </button>
              </div>

              {error && (
                <div className={homeStyles.errorContainer}>
                  <p className={homeStyles.errorText}>{error}</p>
                </div>
              )}

              <div className={homeStyles.examplesCard}>
                <p className={homeStyles.examplesTitle}>Example descriptions</p>
                <div className={homeStyles.examplesList}>
                  {EXAMPLE_DESCRIPTIONS.map((example, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleExampleClick(example)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={homeStyles.exampleChip}
                    >
                      {example}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {formSchema && (
            <motion.div
              key="generated"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className={homeStyles.searchRow}>
                <div className={homeStyles.inputWrapper}>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Form for high school students..."
                    className={homeStyles.textarea}
                    rows={1}
                    disabled={isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (prompt.trim() && !isPending) {
                          handleGenerate();
                        }
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isPending || !prompt.trim()}
                  className={homeStyles.generateButton}
                >
                  {isPending ? (
                    <svg
                      className={homeStyles.spinner}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className={homeStyles.spinnerCircle}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className={homeStyles.spinnerPath}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    'Generate form'
                  )}
                </button>
              </div>

              <ActionsToolbar
                onExport={handleExport}
                onImport={handleImport}
                onCopyCode={handleCopyCode}
                onCreateNew={handleReset}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className={homeStyles.hiddenInput}
                aria-label="Import form schema JSON file"
              />

              <div className="max-w-3xl mx-auto">
                <FormPreview schema={formSchema} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={componentStyles.toast}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}