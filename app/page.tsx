'use client';

import { useState, useTransition, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormSchema } from '@/types/form';
import { generateForm } from './actions';
import FormPreview from '@/components/form-preview';
import ActionsToolbar from '@/components/actions-toolbar';
import { generateFormComponentCode } from '@/lib/code-generator';
import { validateFormSchema } from '@/lib/form-validator';

/** Sample prompts shown as clickable chips on the home view. */
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
  const fileInputRef = useRef<HTMLInputElement>(null); /* Hidden <input type="file"> for Load JSON */

  const handleGenerate = () => {
    if (!prompt.trim()) {
      setError('Please enter a form description');
      return;
    }

    setError(null);
    setFormSchema(null);

    /* useTransition keeps UI responsive; isPending drives loading state. */
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

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  /* Parse file, run validateFormSchema, then setFormSchema on success. */
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
      } catch {
        setError('Failed to parse JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyCode = () => {
    if (!formSchema) return;
    const jsxCode = generateFormComponentCode(formSchema);
    navigator.clipboard.writeText(jsxCode).then(() => {
      showToast('JSX code copied to clipboard!');
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* Enter (without Shift) in the textarea submits the form. */
  /* AnimatePresence mode="wait" swaps home (examples) vs generated (toolbar + FormPreview). */
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Form Builder
          </h1>
          <p className="text-gray-500 mb-8">
            Describe your form in plain English and let AI generate it for you
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 flex h-14 overflow-hidden mb-4">
          <div className="flex-1 flex items-center">
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Form for high school students..."
              className="w-full px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none border-0 bg-transparent"
              rows={1}
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim() && !isPending) handleGenerate();
                }
              }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isPending || !prompt.trim()}
            className="h-14 px-8 bg-blue-700 text-white font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap flex-shrink-0"
          >
            {isPending ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
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
          <div className="max-w-3xl mx-auto mt-3 rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!formSchema && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-3xl mx-auto mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <p className="font-bold text-lg mb-4 text-gray-900">Example descriptions</p>
                <div className="flex flex-col gap-2">
                  {EXAMPLE_DESCRIPTIONS.map((example, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleExampleClick(example)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full text-left p-3 rounded-md border border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-600 bg-white shadow-sm"
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
                className="hidden"
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
              className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg z-50"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}