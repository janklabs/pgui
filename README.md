# pgui

A lightweight web GUI for browsing PostgreSQL databases. Set a few environment variables, run the container, and you're in.

```bash
docker run -p 3000:3000 -e DB_1_HOST=localhost -e DB_1_USERNAME=readonly kvqn/pgui:latest
```

## Features

- **Zero-config** - pass your connection details as env vars and everything is discovered automatically
- **Lightweight** - single Docker container, no external dependencies, no database to maintain
- **Easy to set up** - `docker run` with a few `-e` flags and you're browsing in seconds
- **Read-only** - all connections enforce read-only mode, safe to point at production
- **Multi-server** - connect to as many PostgreSQL servers as you need from one UI
- **Dark / light theme** - toggle or follow system preference

## Quick Start

```bash
docker run -p 3000:3000 \
  -e DB_1_HOST=host.docker.internal \
  -e DB_1_USERNAME=readonly \
  -e DB_1_PASSWORD=secret \
  kvqn/pgui:latest
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Compose

```yaml
services:
  pgui:
    image: kvqn/pgui:latest
    ports:
      - 3000:3000
    environment:
      DB_1_HOST: host.docker.internal
      DB_1_USERNAME: readonly
      DB_1_PASSWORD: secret
    restart: unless-stopped
```

## Configuration

Servers are configured via numbered environment variables (`DB_1_*`, `DB_2_*`, etc.):

| Variable          | Required | Default      | Description              |
| ----------------- | -------- | ------------ | ------------------------ |
| `DB_{N}_NAME`     | No       | `Server {N}` | Display name in the UI   |
| `DB_{N}_HOST`     | Yes      |              | PostgreSQL host          |
| `DB_{N}_PORT`     | No       | `5432`       | PostgreSQL port          |
| `DB_{N}_USERNAME` | Yes      |              | PostgreSQL user          |
| `DB_{N}_PASSWORD` | No       | `""`         | PostgreSQL password      |
| `DB_{N}_SSL`      | No       | `false`      | Set `true` to enable SSL |
