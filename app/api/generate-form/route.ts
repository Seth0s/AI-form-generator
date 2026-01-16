import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FormSchema } from '@/types/form';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a prompt that instructs the AI to generate a FormSchema
    const prompt = `You are a form builder assistant. Given a description of a form, generate a JSON object that matches this TypeScript interface exactly:

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox';
  placeholder?: string;
  required: boolean;
  options?: string[]; // Only include this for 'select' type fields
}

interface FormSchema {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
}

Rules:
1. Generate unique IDs for each field (use camelCase, e.g., "teamName", "memberEmail")
2. Use appropriate field types based on the description
3. Set required: true for fields that are essential
4. Add placeholder text when it makes sense
5. For select fields, include an options array with at least 2 options
6. Make the formTitle and formDescription descriptive and relevant

User's form description: "${description}"

Return ONLY valid JSON that matches the FormSchema interface. Do not include any markdown formatting, code blocks, or explanations. Just the raw JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Parse the JSON response
    const formSchema: FormSchema = JSON.parse(jsonText);

    // Validate the schema
    if (!formSchema.formTitle || !formSchema.fields || !Array.isArray(formSchema.fields)) {
      return NextResponse.json(
        { error: 'Invalid form schema generated' },
        { status: 500 }
      );
    }

    // Ensure each field has required properties
    for (const field of formSchema.fields) {
      if (!field.id || !field.label || !field.type) {
        return NextResponse.json(
          { error: 'Invalid field structure in generated schema' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ schema: formSchema });
  } catch (error) {
    console.error('Error generating form:', error);
    return NextResponse.json(
      { error: 'Failed to generate form. Please try again.' },
      { status: 500 }
    );
  }
}
