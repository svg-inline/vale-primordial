<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# PERFECT WORLD VALE PRIMORDIAL agent notes

## Project shape

- This project is a Next.js 16 App Router migration of the old Vite/LiteDom app in `project-old/`.
- The target app lives in `src/`.
- Supabase is used for game catalog data. Current Divine Books data is seeded and read through `src/lib/queries/divine-books.ts`.
- Use npm for dependency changes in this repo. Avoid mixing package managers further; `package-lock.json` is the active lock.
- On Windows, stop running `node.exe`/`next dev` before reinstalling dependencies if SWC files are locked.

## Skills that make sense here

- `next-best-practices`: use for all Next.js routing, App Router, Server Component, Route Handler, metadata, image/font, and bundling work.
- `next-cache-components`: use only when intentionally migrating/optimizing for Next.js 16 Cache Components or cache lifetimes/tags.
- `tailwind-v4-3-best-practices`: use for Tailwind v4 component styling, design tokens, responsiveness, and class cleanup.
- `accessibility`: use when adding/modifying UI controls, forms, menus, modals, keyboard navigation, aria attributes, contrast, or focus behavior.
- `web-quality-audit`: use before deploy or when asked to audit performance, accessibility, SEO, or best practices.
- `browser:browser` / Browser plugin: use after meaningful frontend changes to verify localhost pages in a real browser, especially `/divine-books`.
- `openai-docs`: use only for OpenAI API/product questions, not for normal app work.

## MCP / plugin usage that fits this project

- Browser / Next DevTools: verify Next pages in a real browser, inspect console errors, test hydration/client behavior, and confirm local routes.
- Chrome DevTools: use if the user explicitly wants Chrome page inspection or browser state.
- Figma: use only if the task asks for design artifacts, diagrams, component libraries, Code Connect, or pushing UI/designs to Figma.
- Spreadsheets: use if game data needs CSV/XLSX analysis, conversion, or workbook output.
- Documents / Presentations: use only if asked for `.docx`, docs deliverables, or slide decks.
- Multi-agent tools: use only when the user explicitly asks for sub-agents/delegation.

## Preferred implementation patterns

- Keep Server Components responsible for initial data load; client components handle interaction.
- Use TanStack Query for client cache/revalidation where already wired.
- Use Zustand for persisted local user state such as theme, language, owned items, presets, and tree progress.
- Use Supabase JS directly for now; do not introduce Prisma unless the project grows into heavier admin/write workflows.
- Use `src/proxy.ts` for Next.js 16 proxy/middleware behavior. Do not add legacy `middleware.ts` unless there is a deliberate compatibility reason.
- Use `cn()` from `src/lib/utils/cn.ts` for conditional classes and Tailwind override merging.
- Prefer components in `src/components/ui` and `src/components/layout` before adding one-off markup.

## Verification baseline

Run these after meaningful changes:

```bash
npm run build
npm run test:run
```

For UI changes, also verify the relevant localhost route with Browser/Next DevTools and check the browser console for errors or warnings.
