# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Build / Lint / Format Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build (standalone output for Docker)
npm run start        # Start production server
npm run lint         # Run ESLint (flat config, Next.js recommended rules)
npm run format:write # Prettier format all source files
npm run format:check # Check formatting without writing
```

There is no test framework configured. No test commands exist.

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript (strict)
- **Styling**: Tailwind CSS v4, shadcn/ui (new-york style, neutral base color)
- **Database**: `pg` (node-postgres), server-side only
- **Theming**: next-themes (class strategy, system default)
- **Package manager**: npm
- **Deployment**: Docker multi-stage build, Node 22 Alpine, standalone output

## Code Style

### Formatting (enforced by Prettier)

- No semicolons
- Double quotes everywhere
- 2-space indentation, 80-char print width
- Trailing commas in all positions
- Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`
- Imports are auto-sorted by `@trivago/prettier-plugin-sort-imports`

### Import Order (enforced by Prettier plugin)

```
1. react
2. next
3. Third-party (lucide-react, pg, next-themes, etc.)
4. @/lib/
5. @/components/
6. @/types/ and other @/
7. Relative (./)
```

- Use `import type` for type-only imports: `import type { ServerConfig } from "@/types/database"`
- Named imports are alphabetized within braces

### Naming

| Entity              | Convention                | Example                                        |
| ------------------- | ------------------------- | ---------------------------------------------- |
| Files               | kebab-case                | `schema-tree.tsx`, `server-card.tsx`           |
| Components          | PascalCase functions      | `export function SchemaTree()`                 |
| Pages/Layouts       | PascalCase default export | `export default async function ServerPage()`   |
| Variables/functions | camelCase                 | `getServerConfigs`, `formatRowCount`           |
| Types/Interfaces    | PascalCase                | `ServerConfig`, `TableDataResult`              |
| Props interfaces    | `{Component}Props`        | `ServerCardProps`, `DataTableProps`            |
| Environment vars    | `DB_{N}_{FIELD}`          | `DB_1_HOST`, `DB_2_USERNAME`, `DB_1_DATABASES` |

### Exports

- **Pages and layouts**: `export default async function` (always default, always async)
- **Components**: `export function` (named exports, never default)
- **Library functions**: `export function` / `export async function` (named)
- **Types**: `export interface` from `src/types/database.ts`
- **Metadata**: `export const metadata` (static) or `export async function generateMetadata` (dynamic)
- Private helpers are not exported (e.g., `quoteIdent`, `formatRowCount`)
- No barrel exports / index.ts re-export files

### Functions

- Use regular `function` declarations for components and exports, not arrow functions
- Arrow functions only for callbacks, `.map()`/`.filter()`, event handlers, `useCallback`
- Never use `React.FC` -- type props via destructured parameters

## Code Quality

- **No comments.** Code should be self-explanatory through clear naming and simple structure. Do not write comments to explain what code does -- if the code needs a comment to be understood, rewrite the code to be clearer instead. The only acceptable exceptions are: legal headers if required, and brief `TODO` markers for known incomplete work.
- **No dead code.** Do not leave commented-out code, unused imports, or unused variables.
- **Small functions.** Extract helpers rather than writing long functions. Each function should do one thing.
- **Explicit over clever.** Prefer straightforward code over terse or clever abstractions. Readability is the priority.
- **No `any`.** TypeScript strict mode is on. Use proper types, `unknown` with narrowing, or generics instead of `any`.

## Component Patterns

### Server vs Client Components

Components are server components by default. Add `"use client"` only when needed:

- React hooks (`useState`, `useEffect`, `useCallback`)
- Browser APIs or event handlers
- Next.js client hooks (`useRouter`, `usePathname`, `useSearchParams`, `useParams`, `useTheme`)

Data fetching happens in server components (pages/layouts). Client components receive data via props.

### shadcn/ui Usage

- Import from `@/components/ui/{name}`: `import { Card } from "@/components/ui/card"`
- Icons from `lucide-react`, sized with Tailwind: `className="h-4 w-4"`
- Use `cn()` from `@/lib/utils` only inside UI primitives, not in app components
- App components use raw className strings with template literals for conditionals:
  ```tsx
  className={`hover:bg-accent flex ... ${isActive ? "bg-accent font-medium" : ""}`}
  ```

### Props

Reusable components use named interfaces:

```tsx
interface ServerCardProps {
  config: ServerConfig
  status: { ok: boolean; error?: string }
}
export function ServerCard({ config, status }: ServerCardProps) {}
```

Pages, layouts, and internal sub-components use inline types:

```tsx
export default async function SchemaPage({
  params,
}: {
  params: Promise<{ serverId: string; dbName: string; schema: string }>
}) {}
```

## Route Params (Next.js 15+ Pattern)

Params and searchParams are `Promise` objects that must be awaited:

```tsx
const { serverId, dbName } = await params
const sp = await searchParams
```

Always decode URL segments: `const decodedSchema = decodeURIComponent(schema)`

## Page Titles

The root layout defines a title template: `"%s · pgui"`. Each page provides its own title segment via `metadata` or `generateMetadata()`, and the template appends `· pgui` automatically.

Titles use two-level context (current item + parent):

| Route                | Title Example              |
| -------------------- | -------------------------- |
| `/`                  | `servers · pgui`           |
| `/server/[serverId]` | `Production · pgui`        |
| `…/db/[dbName]`      | `mydb · Production · pgui` |
| `…/[schema]`         | `public · mydb · pgui`     |
| `…/[schema]/[table]` | `users · public · pgui`    |

- The home page uses `title.absolute` since the template does not apply to pages in the same segment as the layout
- Dynamic pages use `generateMetadata()` to resolve route params
- `getServerConfig()` calls in `generateMetadata` are deduplicated by Next.js (same request as the page component)

## Database Patterns

- All database code lives in `src/lib/db/` (config, pool, queries) -- server-side only
- Query functions take `config: ServerConfig` first, then hierarchical IDs: `databaseName`, `schema`, `table`
- Pools are keyed by `serverId:databaseName`, defaulting to `postgres` for discovery
- All connections enforce read-only mode (`SET default_transaction_read_only = true`)
- Use parameterized queries (`$1`, `$2`) for user values, `quoteIdent()` for identifiers
- Type query results with generics: `pool.query<DatabaseInfo>(...)`
- Use `Promise.all()` for parallel data fetching

## Error Handling

**Server pages** -- try/catch with `let error: string | null = null`:

```tsx
try {
  data = await fetchData(config, db)
} catch (err) {
  error = err instanceof Error ? err.message : "Failed to load data"
}
```

**API routes** -- return JSON with status codes:

```tsx
return NextResponse.json({ error: "..." }, { status: 500 })
```

**Not found** -- call `notFound()` from `next/navigation` for missing configs or entities.

**Client-side fetch** -- silent catch (user retries by re-interacting):

```tsx
try { ... } catch { /* user can retry */ }
```

## URL Structure

```
/                                                    Home (server list)
/server/[serverId]                                   Server overview (database list)
/server/[serverId]/db/[dbName]                       Database overview (schemas)
/server/[serverId]/db/[dbName]/[schema]              Schema (tables/views)
/server/[serverId]/db/[dbName]/[schema]/[table]      Table data browser
```

API routes mirror the page structure under `/api/server/...`.

## Environment Variables

Servers are configured via numbered env vars (`DB_1_*`, `DB_2_*`, ...).
The app scans sequentially and stops at the first gap.

```
DB_1_DISPLAY_NAME=production    # Display name (defaults to "Server N")
DB_1_HOST=localhost             # Required
DB_1_PORT=5432                  # Optional, defaults to 5432
DB_1_USERNAME=readonly          # Required
DB_1_PASSWORD=secret            # Optional, defaults to ""
DB_1_SSL=false                  # Optional, defaults to false
DB_1_AUTODISCOVER=true          # Optional, defaults to true (discover all databases)
DB_1_DATABASES=db1,db2          # Optional, comma-separated list (mutually exclusive with AUTODISCOVER)
```

`DB_{N}_AUTODISCOVER` and `DB_{N}_DATABASES` are mutually exclusive.
When `DB_{N}_DATABASES` is set, autodiscovery is disabled automatically.
Explicitly setting `AUTODISCOVER=true` with `DATABASES` set is a config error.

Env vars are only read in `src/lib/db/config.ts`, never in client components.
