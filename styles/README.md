# 📁 Estrutura de Estilos

Esta pasta contém os arquivos de estilo do projeto.

## 📂 Estrutura

```
styles/
├── globals.css              # Estilos globais e variáveis CSS
├── generated-form.css       # Estilos para código JSX gerado (usado no "Copy JSX Code")
├── index.ts                 # Exportações centralizadas
└── README.md                # Este arquivo
```

## 📝 Descrição dos Arquivos

### `globals.css`
- Variáveis CSS do tema (cores, espaçamentos, etc.)
- Estilos base do Tailwind
- Estilos globais do body e elementos base
- Suporte a dark mode

### `generated-form.css`
- Estilos para o código JSX gerado pela funcionalidade "Copy JSX Code"
- Esses estilos são incluídos como comentário no código gerado
- Usuários podem copiar esses estilos para seus projetos

## 🎨 Como Usar

### Estilos Globais

Os estilos globais são importados automaticamente em `app/layout.tsx`:

```typescript
import '../styles/globals.css';
```

### Tailwind CSS

O projeto usa **Tailwind CSS diretamente** nos componentes. Todas as classes são aplicadas inline no JSX, sem necessidade de arquivos CSS Modules.

## 📌 Nota

Este projeto utiliza **Tailwind CSS** para todos os estilos, aplicados diretamente nos componentes React. Não há necessidade de arquivos CSS Modules separados.
