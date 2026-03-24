import pg from "pg"

import type { ServerConfig } from "@/types/database"

const DEFAULT_DATABASE = "postgres"

const pools = new Map<string, pg.Pool>()

export function getPool(config: ServerConfig, databaseName?: string): pg.Pool {
  const dbName = databaseName || DEFAULT_DATABASE
  const key = `${config.id}:${dbName}`
  const existing = pools.get(key)
  if (existing) {
    return existing
  }

  const pool = new pg.Pool({
    host: config.host,
    port: config.port,
    database: dbName,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    options: "-c default_transaction_read_only=on",
  })

  pool.on("error", (err) => {
    console.error(
      `Pool error for server ${config.displayName} database ${dbName}:`,
      err,
    )
  })

  pools.set(key, pool)
  return pool
}

export async function testConnection(
  config: ServerConfig,
): Promise<{ ok: boolean; error?: string; latencyMs?: number }> {
  const start = Date.now()
  try {
    const pool = getPool(config)
    const result = await pool.query("SELECT 1 AS connected")
    const latencyMs = Date.now() - start
    if (result.rows[0]?.connected === 1) {
      return { ok: true, latencyMs }
    }
    return { ok: false, error: "Unexpected query result" }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
