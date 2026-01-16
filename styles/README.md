# 📁 Estrutura de Estilos

Esta pasta contém todos os arquivos de estilo organizados por página e componente.

## 📂 Estrutura

```
styles/
├── globals.css              # Estilos globais e variáveis CSS
├── home.module.css          # Estilos específicos da página principal (app/page.tsx)
├── form-preview.module.css  # Estilos do componente FormPreview
├── components.module.css    # Estilos compartilhados de componentes
├── index.ts                 # Exportações centralizadas
└── README.md                # Este arquivo
```

## 📝 Descrição dos Arquivos

### `globals.css`
- Variáveis CSS do tema (cores, espaçamentos, etc.)
- Estilos base do Tailwind
- Estilos globais do body e elementos base
- Suporte a dark mode

### `home.module.css`
- Estilos da página principal (`app/page.tsx`)
- Classes para:
  - Container e layout
  - Header (título e subtítulo)
  - Search row (input e botão)
  - Examples card
  - Mensagens de erro

### `form-preview.module.css`
- Estilos do componente `FormPreview`
- Classes para:
  - Formulário e campos
  - Inputs, textareas, selects, checkboxes
  - Labels e validação
  - Botão de submit

### `components.module.css`
- Estilos compartilhados entre componentes
- Classes para:
  - Toolbar de ações
  - Headers de ação
  - Cards de formulário
  - Toast notifications

## 🎨 Como Usar

### Em Componentes React

```typescript
import styles from '@/styles/home.module.css';

// Use as classes
<div className={styles.container}>
  <h1 className={styles.title}>Título</h1>
</div>
```

### Estilos Globais

Os estilos globais são importados automaticamente em `app/layout.tsx`:

```typescript
import '../styles/globals.css';
```

## 📌 Nota

A maioria dos estilos ainda usa Tailwind CSS inline. Os módulos CSS aqui são para:
- Organização e manutenibilidade
- Estilos complexos que não são facilmente expressos com Tailwind
- Reutilização de estilos entre componentes
