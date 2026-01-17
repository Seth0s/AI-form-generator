# AI Form Builder

A Next.js application that generates functional forms from plain English descriptions using Google's Gemini AI.

## Features

- 🤖 **AI-Powered Generation**: Describe your form in plain English and let AI generate it
- 🎨 **Modern UI**: Built with Tailwind CSS and responsive design
- 📝 **Multiple Field Types**: Supports text, textarea, number, email, select, and checkbox fields
- ⚡ **Real-time Rendering**: Generated forms are immediately interactive
- 🔒 **Type-Safe**: Built with TypeScript for type safety

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Generative AI SDK** (`@google/generative-ai`)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a description of the form you want to create (e.g., "A registration form for a hackathon with team name and members")
2. Click "Generate Form"
3. The AI will generate a functional form based on your description
4. Fill out and submit the form to see the data

## Project Structure

```
├── app/
│   ├── actions.ts                 # Server Action for form generation (uses Gemini API)
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page component
├── components/
│   ├── form-preview.tsx           # Component to render and preview generated forms
│   └── actions-toolbar.tsx        # Toolbar with Save/Load/Copy actions
├── lib/
│   ├── code-generator.ts          # Utility to generate JSX code from schema
│   └── form-validator.ts         # Utility to validate imported form schemas
├── types/
│   └── form.ts                    # TypeScript type definitions (FormSchema, FormField)
├── styles/
│   ├── globals.css                # Global styles and CSS variables
│   └── generated-form.css         # Styles for generated JSX code
└── package.json
```

## Type Definitions

The application uses a strict `FormSchema` interface:

```typescript
type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Only for 'select' type
}

interface FormSchema {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your `GEMINI_API_KEY` as an environment variable
4. Deploy!

### Other Platforms

Make sure to set the `GEMINI_API_KEY` environment variable in your hosting platform's settings.

## License

MIT
