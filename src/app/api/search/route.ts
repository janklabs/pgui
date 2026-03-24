import { NextResponse } from "next/server"

import { getServerConfigs } from "@/lib/db/config"
import {
  getDatabases,
  getDatabasesByNames,
  getSchemas,
  getTables,
} from "@/lib/db/queries"
import type { ServerConfig } from "@/types/database"

interface NavigationItem {
  serverId: string
  serverName: string
  dbName: string
  schema: string
  tableName: string
  tableType: "BASE TABLE" | "VIEW"
}

let cache: { data: NavigationItem[]; timestamp: number } | null = null
const CACHE_TTL = 60_000 // 60 seconds

async function buildNavigationIndex(): Promise<NavigationItem[]> {
  const configs = await getServerConfigs()
  const items: NavigationItem[] = []

  const serverResults = await Promise.allSettled(
    configs.map((config) => buildServerItems(config)),
  )

  for (const result of serverResults) {
    if (result.status === "fulfilled") {
      items.push(...result.value)
    }
  }

  return items
}

async function buildServerItems(
  config: ServerConfig,
): Promise<NavigationItem[]> {
  const items: NavigationItem[] = []

  if (config.configError) return items

  const databases =
    config.databases && config.databases.length > 0
      ? await getDatabasesByNames(config, config.databases)
      : await getDatabases(config)

  const dbResults = await Promise.allSettled(
    databases.map(async (db) => {
      const schemas = await getSchemas(config, db.name)

      const schemaResults = await Promise.allSettled(
        schemas.map(async (schema) => {
          const tables = await getTables(config, db.name, schema.schema_name)
          return tables.map(
            (table): NavigationItem => ({
              serverId: config.id,
              serverName: config.displayName,
              dbName: db.name,
              schema: schema.schema_name,
              tableName: table.table_name,
              tableType: table.table_type,
            }),
          )
        }),
      )

      const schemaItems: NavigationItem[] = []
      for (const result of schemaResults) {
        if (result.status === "fulfilled") {
          schemaItems.push(...result.value)
        }
      }
      return schemaItems
    }),
  )

  for (const result of dbResults) {
    if (result.status === "fulfilled") {
      items.push(...result.value)
    }
  }

  return items
}

export async function GET() {
  const now = Date.now()

  if (cache && now - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  try {
    const data = await buildNavigationIndex()
    cache = { data, timestamp: now }
    return NextResponse.json(data)
  } catch (err) {
    console.error("Failed to build navigation index:", err)
    return NextResponse.json(
      { error: "Failed to build search index" },
      { status: 500 },
    )
  }
}
