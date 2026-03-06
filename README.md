# pgui

A lightweight, read-only web GUI for browsing PostgreSQL databases. Configure your servers via environment variables, and pgui automatically discovers all databases, schemas, tables, and views — giving you a clean interface to explore structure and data.

## Features

- **Multi-server support** — connect to multiple PostgreSQL servers simultaneously
- **Automatic discovery** — databases, schemas, tables, and views are discovered automatically
- **Table data browser** — paginated data grid with column sorting, text filtering, and type-aware cell rendering
- **Structure inspection** — view columns, indexes, and constraints for any table
- **Create databases** — create new databases directly from the UI
- **Dark / light theme** — toggle between themes, defaults to system preference
- **Read-only connections** — all pooled connections enforce `default_transaction_read_only = true`
- **Copy connection URL** — one-click copy of `postgresql://` connection strings

## Quick Start

### Docker (recommended)

```bash
docker run -p 3000:3000 \
  -e DB_1_NAME=production \
  -e DB_1_HOST=host.docker.internal \
  -e DB_1_PORT=5432 \
  -e DB_1_USER=readonly \
  -e DB_1_PASSWORD=secret \
  your-image:latest
```

Or with Docker Compose:

```yaml
services:
  pgui:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_1_NAME=production
      - DB_1_HOST=host.docker.internal
      - DB_1_PORT=5432
      - DB_1_USER=readonly
      - DB_1_PASSWORD=secret
    restart: unless-stopped
```

### Local Development

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse your databases.

## Configuration

Servers are configured through numbered environment variables. The app scans `DB_1_*`, `DB_2_*`, `DB_3_*`, etc., stopping at the first gap.

| Variable          | Required | Default      | Description              |
| ----------------- | -------- | ------------ | ------------------------ |
| `DB_{N}_NAME`     | No       | `Server {N}` | Display name in the UI   |
| `DB_{N}_HOST`     | Yes      |              | PostgreSQL host          |
| `DB_{N}_PORT`     | No       | `5432`       | PostgreSQL port          |
| `DB_{N}_USER`     | Yes      |              | PostgreSQL user          |
| `DB_{N}_PASSWORD` | No       | `""`         | PostgreSQL password      |
| `DB_{N}_SSL`      | No       | `false`      | Set `true` to enable SSL |

Example with two servers:

```bash
# Server 1
DB_1_NAME=production
DB_1_HOST=localhost
DB_1_USER=readonly
DB_1_PASSWORD=secret

# Server 2
DB_2_NAME=staging
DB_2_HOST=staging-db.internal
DB_2_USER=readonly
DB_2_PASSWORD=secret2
DB_2_SSL=true
```

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start development server             |
| `npm run build`        | Production build (standalone output) |
| `npm run start`        | Start production server              |
| `npm run lint`         | Run ESLint                           |
| `npm run format`       | Format all files with Prettier       |
| `npm run format:check` | Check formatting without writing     |

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, standalone output)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives)
- [node-postgres](https://node-postgres.com) (`pg`)
- [Lucide](https://lucide.dev) icons
