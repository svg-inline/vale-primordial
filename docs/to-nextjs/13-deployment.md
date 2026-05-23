# 13 — Deploy: Vercel + Supabase

## Vercel (free tier)

### Limites do free tier

| Recurso                      | Limite     |
| ---------------------------- | ---------- |
| Deploys                      | Ilimitado  |
| Bandwidth                    | 100 GB/mês |
| Serverless Function duration | 10s        |
| Edge Function duration       | 30s        |
| Build time                   | 45 min     |
| Projetos                     | Ilimitado  |

> Este projeto não usa Serverless Functions para cálculo — tudo é client-side ou RSC com `fetch`
> direto para o Supabase. O free tier é mais que suficiente.

---

## Supabase (free tier)

| Recurso          | Limite              |
| ---------------- | ------------------- |
| Projetos ativos  | 2                   |
| Banco de dados   | 500 MB              |
| Storage          | 1 GB                |
| Bandwidth        | 5 GB/mês            |
| Auth MAU         | 50.000 usuários     |
| Pausa automática | Após 7 dias sem uso |

> Os dados de jogo somam poucos MB. O free tier é adequado.
> Para evitar pausa: usar o projeto ao menos uma vez por semana ou usar o `pg_cron`
> para manter ativo.

---

## 1. Criar projeto no Supabase

1. Acessar https://supabase.com/dashboard
2. "New project"
3. Nome: `perfect-world-helper`
4. Região: `South America (São Paulo)` → `sa-east-1`
5. Senha do banco: salvar em local seguro (não commitar)
6. Aguardar provisionamento (~2 min)

---

## 2. Rodar migrations

```bash
# Conectar ao projeto remoto
npx supabase link --project-ref SEU_PROJECT_ID

# Aplicar migrations
npx supabase db push

# Ou rodar diretamente via SQL Editor no dashboard
```

---

## 3. Seed dos dados

```bash
# Criar variável de ambiente temporária com service_role (NUNCA no .env.local para client)
SUPABASE_SERVICE_ROLE_KEY=... npm run db:seed
```

> A `service_role_key` deve ser usada apenas em scripts de seed rodando localmente.
> Nunca colocar no frontend nem no `.env.local` sem prefixo `NEXT_PUBLIC_`.

---

## 4. Criar projeto na Vercel

```bash
# Instalar CLI da Vercel
npm install -g vercel

# Fazer deploy
vercel

# Seguir o wizard:
# - Set up and deploy → Yes
# - Which scope → sua conta
# - Link to existing project → No
# - Project name → perfect-world-helper
# - Directory → ./
# - Override build settings → No
```

---

## 5. Configurar variáveis de ambiente na Vercel

No dashboard Vercel → Settings → Environment Variables:

| Nome                            | Valor                            | Ambientes                        |
| ------------------------------- | -------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxx.supabase.co`        | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJh...`                        | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL`           | `https://seu-dominio.vercel.app` | Production                       |

---

## 6. GitHub Actions para CI/CD automático

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run test:run
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

Secrets do GitHub necessários:

- `VERCEL_TOKEN` → Vercel Dashboard → Settings → Tokens
- `VERCEL_ORG_ID` → `.vercel/project.json` após `vercel link`
- `VERCEL_PROJECT_ID` → `.vercel/project.json`

---

## 7. Configurar domínio personalizado (opcional)

No Vercel Dashboard → Domains:

- Adicionar domínio
- Configurar DNS no registrar: CNAME para `cname.vercel-dns.com`

---

## 8. Monitoramento

### Vercel Analytics (gratuito)

```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Vercel Speed Insights (gratuito)

```bash
npm install @vercel/speed-insights
```

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## 9. Cache e performance

### Next.js cache para dados estáticos do Supabase

```ts
// Dados de jogo mudam raramente — cache de 1 hora
export async function getDivineBookCatalogServer() {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("type", "divine-book");

  return data;
}
```

Para controle granular com `fetch` puro:

```ts
// Cache por 1 hora, revalidar a cada deploy
const data = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/items`,
  {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    next: { revalidate: 3600 }, // 1 hora
  },
);
```

> O Supabase JS client por padrão não usa o cache do Next.js `fetch`.
> Para dados estáticos de jogo, considerar usar `fetch` diretamente com `next: { revalidate }`.

---

## 10. Checklist de deploy

- [ ] Migrations rodadas no Supabase remoto
- [ ] Seed de dados concluído
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Build local passando: `npm run build`
- [ ] Testes passando: `npm run test:run`
- [ ] RLS policies habilitadas nas tabelas
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` tem somente acesso de leitura
- [ ] Domínio configurado (opcional)
- [ ] Analytics instalado
