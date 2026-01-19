'use client';

import { ArrowDown, ArrowUp, Clipboard } from 'lucide-react';

/** Toolbar above the generated form: Create new, Save JSON, Load JSON, Copy JSX. */
interface ActionsToolbarProps {
  onExport: () => void;
  onImport: () => void;
  onCopyCode: () => void;
  onCreateNew: () => void;
}

export default function ActionsToolbar({
  onExport,
  onImport,
  onCopyCode,
  onCreateNew,
}: ActionsToolbarProps) {
  return (
    <div className="max-w-3xl mx-auto flex items-center gap-3 py-4">
      <button
        onClick={onCreateNew}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        Create new form
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <ArrowDown className="h-4 w-4" />
          Save JSON
        </button>
        <button
          onClick={onImport}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <ArrowUp className="h-4 w-4" />
          Load JSON
        </button>
        <button
          onClick={onCopyCode}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Clipboard className="h-4 w-4" />
          Copy JSX Code
        </button>
      </div>
    </div>
  );
}
