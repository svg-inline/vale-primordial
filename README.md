# PERFECT WORLD VALE PRIMORDIAL

Aplicacao Next.js para consultas e calculadoras de Perfect World.

## Scripts

```bash
npm run dev
npm run build
npm run test:run
npm run db:seed:divine-books
```

## Supabase

Leitura usa:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Seed de Livros Divinos exige uma chave privada:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

## Estado da migracao

- Next.js App Router criado na raiz do projeto.
- Dados JSON migrados para `src/lib/data`.
- Livros Divinos ja rodam como tela React com filtros, inventario local e calculo de materiais.
- A leitura dos Livros Divinos tenta Supabase primeiro e usa JSON local como fallback.
- Drops Dusk, Equipamentos e Pedras ja possuem rotas em Next; os JSONs atuais dessas features estao vazios em `project-old`.
- Supabase esta conectado para leitura; as tabelas existem, mas ainda precisam de seed.
