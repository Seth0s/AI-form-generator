// Script para listar modelos disponíveis na API Gemini
// Use: node check-models.js (lê de .env.local automaticamente no Next.js)
// Ou: GEMINI_API_KEY=sua_chave node check-models.js

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Erro: GEMINI_API_KEY não encontrada!");
  console.log("\nConfigure a chave de uma das seguintes formas:");
  console.log("1. Crie um arquivo .env.local com: GEMINI_API_KEY=sua_chave");
  console.log("2. Execute: $env:GEMINI_API_KEY='sua_chave'; node check-models.js");
  console.log("\nObtenha sua chave em: https://aistudio.google.com/app/apikey");
  process.exit(1);
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    console.log("🔍 Buscando modelos disponíveis na API Gemini...");
    console.log("");
    
    const response = await fetch(url);
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Erro na resposta:", response.status, response.statusText);
        console.error("Resposta:", responseText);
        return;
      }
      
      if (errorData.error) {
        console.error(`❌ Erro da API: ${errorData.error.message}`);
        if (errorData.error.code === 400 && errorData.error.message.includes('API key')) {
          console.error("\n⚠️  A API key parece estar inválida ou expirada.");
          console.log("Verifique sua chave em: https://aistudio.google.com/app/apikey");
        }
      }
      return;
    }
    
    const data = JSON.parse(responseText);
    
    if (data.models && Array.isArray(data.models)) {
        console.log(`✅ Encontrados ${data.models.length} modelo(s) disponível(is)\n`);
        
        if (data.models.length === 0) {
          console.log("⚠️  Nenhum modelo retornado pela API.");
        } else {
          // Filtrar modelos que suportam generateContent
          const generateContentModels = data.models.filter(m => 
            m.supportedGenerationMethods && 
            m.supportedGenerationMethods.includes('generateContent')
          );
          
          console.log(`📋 MODELOS COM generateContent (${generateContentModels.length}):\n`);
          generateContentModels.forEach((m, index) => {
            console.log(`${index + 1}. ${m.name}`);
            if (m.displayName) {
              console.log(`   Nome: ${m.displayName}`);
            }
          });
          
          console.log(`\n📋 TODOS OS MODELOS (${data.models.length}):\n`);
          data.models.forEach((m, index) => {
            const supportsGenerate = m.supportedGenerationMethods?.includes('generateContent') ? '✅' : '❌';
            console.log(`${index + 1}. ${supportsGenerate} ${m.name}`);
            if (m.displayName && m.displayName !== m.name) {
              console.log(`   Nome: ${m.displayName}`);
            }
          });
        }
    } else {
        console.log("⚠️  Resposta não contém array de modelos.");
        console.log("Estrutura:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Erro na requisição:", error.message);
    if (error.stack) {
      console.error("\nStack:", error.stack);
    }
  }
}

listModels();
