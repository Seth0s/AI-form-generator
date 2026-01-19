'use server';

import { FormSchema } from '@/types/form';

// Configuração para Vercel: permite até 60 segundos de execução
export async function maxDuration() {
  return 60000;
}

// Função auxiliar para criar timeout
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

export async function generateForm(prompt: string): Promise<{ success: true; schema: FormSchema } | { success: false; error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY is not configured' };
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { success: false, error: 'Prompt is required' };
  }

  // Envolver toda a lógica com timeout de 60 segundos
  try {
    return await withTimeout(
      generateFormInternal(prompt, apiKey),
      60000, // 60 segundos em milissegundos
      'Timeout: A operação excedeu 60 segundos. Por favor, tente novamente.'
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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemInstruction }, 
                { text: `User request: ${prompt}` }
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json', // Força o Gemini a devolver JSON
          },
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
    
    // Extraindo o texto da resposta
    let jsonString = data.candidates[0].content.parts[0].text;
    
    // Limpar a resposta - remover possíveis markdown code blocks
    jsonString = jsonString.trim();
    
    // Remover markdown code blocks se existirem
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }
    
    // Tentar extrair apenas o JSON válido (caso haja texto antes/depois)
    // Procurar pelo primeiro { e último } válido
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
    
    // Parseando para garantir que é um objeto válido
    let formSchema: FormSchema;
    try {
      formSchema = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response (first 1000 chars):', jsonString.substring(0, 1000));
      console.error('Raw response length:', jsonString.length);
      
      // Estratégia 1: Extrair JSON usando regex (mais robusto)
      try {
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          formSchema = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON parseado usando regex');
        } else {
          throw new Error('No JSON object found with regex');
        }
      } catch {
        // Estratégia 2: Limpeza agressiva manual
        try {
          const firstBrace = jsonString.indexOf('{');
          const lastBrace = jsonString.lastIndexOf('}');
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const cleanedJson = jsonString.substring(firstBrace, lastBrace + 1);
            formSchema = JSON.parse(cleanedJson);
            console.log('✅ JSON parseado após limpeza manual');
          } else {
            throw new Error('Could not find JSON boundaries');
          }
        } catch {
          // Estratégia 3: Tentar encontrar múltiplos objetos JSON e pegar o maior
          try {
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
              // Pegar o maior objeto JSON
              const largestJson = jsonObjects.reduce((a, b) => a.length > b.length ? a : b);
              formSchema = JSON.parse(largestJson);
              console.log('✅ JSON parseado extraindo o maior objeto');
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

    // Validate the schema
    if (!formSchema.formTitle || !formSchema.fields || !Array.isArray(formSchema.fields)) {
      return { 
        success: false, 
        error: 'Invalid form schema generated: missing formTitle or fields' 
      };
    }

    // Ensure each field has required properties
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
