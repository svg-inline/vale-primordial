# 01 — Setup do Projeto

## Pré-requisitos

- Node.js 20+
- npm 10+ ou pnpm 9+
- Conta Supabase (free tier)
- Conta Vercel (free tier)
- Conta GitHub

---

## 1. Criar o projeto Next.js

```bash
npx create-next-app@latest perfect-world-helper \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

Respostas esperadas durante o wizard:

- Would you like to use Turbopack? → **Yes**
- Would you like to customize the import alias? → **Yes → `@/*`**

---

## 2. Instalar dependências de produção

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  @tanstack/react-query \
  zustand \
  next-intl \
  next-themes \
  lucide-react
```

### Dependências de desenvolvimento

```bash
npm install -D \
  @tanstack/react-query-devtools \
  @types/node \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/jest-dom \
  supabase
```

---

## 3. Instalar Supabase CLI

```bash
npm install -D supabase
npx supabase login
npx supabase init
```

---

## 4. Configurar variáveis de ambiente

Criar `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_publica

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> As variáveis `NEXT_PUBLIC_*` são expostas ao browser. A `anon_key` do Supabase
> é segura para expor — as RLS policies protegem os dados.

Adicionar ao `.gitignore`:

```
.env.local
.env.*.local
```

---

## 5. Configurar `next.config.ts`

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
```

---

## 6. Configurar Tailwind v4

O `create-next-app` instala Tailwind v3 por padrão. Para usar v4:

```bash
npm install tailwindcss@next @tailwindcss/postcss@next
npm uninstall tailwindcss postcss autoprefixer
```

Criar `postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

Em `src/app/globals.css`, substituir por:

```css
@import "tailwindcss";
```

> Copiar o restante do `src/shared/styles/main.css` atual (CSS variables, presets) para este arquivo.

---

## 7. Estrutura de pastas mínima após setup

```
perfect-world-helper/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ globals.css
│  ├─ i18n/
│  ├─ lib/
│  ├─ stores/
│  └─ components/
├─ supabase/
│  └─ migrations/
├─ public/
│  └─ assets/
├─ .env.local
├─ next.config.ts
└─ package.json
```

---

## 8. Scripts recomendados em `package.json`

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "db:push": "supabase db push",
    "db:pull": "supabase db pull",
    "db:types": "supabase gen types typescript --local > src/lib/supabase/types.ts"
  }
}
```
