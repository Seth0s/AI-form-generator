'use server';

import { FormSchema } from '@/types/form';

/** Vercel: extends serverless function limit to 60 seconds. */
export async function maxDuration() {
  return 60000;
}

/** Wraps a promise with a timeout using Promise.race. */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Server Action: calls Gemini to generate a FormSchema from a text description.
 * Returns { success, schema } or { success: false, error }.
 */
export async function generateForm(prompt: string): Promise<{ success: true; schema: FormSchema } | { success: false; error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY is not configured' };
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { success: false, error: 'Prompt is required' };
  }

  /* Run the actual generation with a 60s cap; forward timeout as user-facing error. */
  try {
    return await withTimeout(
      generateFormInternal(prompt, apiKey),
      60000,
      'Timeout: The operation exceeded 60 seconds. Please try again.'
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Timeout')) {
      return { success: false, error: error.message };
    }
    console.error('Error generating form:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate form. Please try again.' 
    };
  }
}

/** Core logic: Gemini request, JSON extraction, fallback parsing, and schema validation. */
async function generateFormInternal(prompt: string, apiKey: string): Promise<{ success: true; schema: FormSchema } | { success: false; error: string }> {
  const systemInstruction = `
    You are an expert form builder.
    Your job is to take a user description and return a JSON object representing a form.
    The output MUST be a raw JSON string. Do not use Markdown code blocks (like \`\`\`json).
    
    The JSON structure must match this interface:
    {
      "formTitle": "string",
      "formDescription": "string",
      "fields": [
        {
          "id": "string (unique, camelCase)",
          "label": "string",
          "type": "text" | "textarea" | "number" | "email" | "select" | "checkbox",
          "placeholder": "string (optional)",
          "required": boolean,
          "options": ["string"] (only for select type)
        }
      ]
    }
    
    Rules:
    1. Generate unique IDs for each field (use camelCase, e.g., "teamName", "memberEmail")
    2. Use appropriate field types based on the description
    3. Set required: true for fields that are essential
    4. Add placeholder text when it makes sense
    5. For select fields, include an options array with at least 2 options
    6. Make the formTitle and formDescription descriptive and relevant
  `;

  try {
    /* Gemini REST: system instruction + user prompt; responseMimeType nudges raw JSON. */
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction }, { text: `User request: ${prompt}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      return { 
        success: false, 
        error: `Gemini API Error: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    let jsonString = data.candidates[0].content.parts[0].text;

    /* 1. Trim leading/trailing whitespace. */
    jsonString = jsonString.trim();

    /* 2. Strip Markdown code fences (```json ... ``` or ``` ... ```). */
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }

    /* 3. Extract substring between first { and last } when there is extra text before/after. */
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    let formSchema: FormSchema;
    try {
      /* 4. Primary: parse the cleaned string as JSON. */
      formSchema = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response (first 1000 chars):', jsonString.substring(0, 1000));
      console.error('Raw response length:', jsonString.length);

      try {
        /* 5. Fallback A: regex to capture the first {...} object. */
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch?.[0]) {
          formSchema = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON object found with regex');
        }
      } catch {
        try {
          /* 6. Fallback B: re-apply first { and last } boundaries. */
          const firstBrace = jsonString.indexOf('{');
          const lastBrace = jsonString.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            formSchema = JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
          } else {
            throw new Error('Could not find JSON boundaries');
          }
        } catch {
          try {
            /* 7. Fallback C: find all complete {...} by brace depth, parse the largest. */
            const jsonObjects: string[] = [];
            let depth = 0;
            let start = -1;
            for (let i = 0; i < jsonString.length; i++) {
              if (jsonString[i] === '{') {
                if (depth === 0) start = i;
                depth++;
              } else if (jsonString[i] === '}') {
                depth--;
                if (depth === 0 && start !== -1) {
                  jsonObjects.push(jsonString.substring(start, i + 1));
                  start = -1;
                }
              }
            }

            if (jsonObjects.length > 0) {
              const largest = jsonObjects.reduce((a, b) => (a.length > b.length ? a : b));
              formSchema = JSON.parse(largest);
            } else {
              throw new Error('No valid JSON objects found');
            }
          } catch {
            return { 
              success: false, 
              error: `Failed to parse AI response. Tried multiple parsing strategies. Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Please try again.` 
            };
          }
        }
      }
    }

    /* Require formTitle and a non-empty fields array. */
    if (!formSchema.formTitle || !formSchema.fields || !Array.isArray(formSchema.fields)) {
      return { 
        success: false, 
        error: 'Invalid form schema generated: missing formTitle or fields' 
      };
    }

    /* Each field must have id, label, and type. */
    for (const field of formSchema.fields) {
      if (!field.id || !field.label || !field.type) {
        return { 
          success: false, 
          error: 'Invalid field structure in generated schema' 
        };
      }
    }

    return { success: true, schema: formSchema };

  } catch (error) {
    console.error('Error generating form:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate form. Please try again.' 
    };
  }
}
