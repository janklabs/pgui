import pg from "pg"
import type {
  ColumnInfo,
  ConstraintInfo,
  DatabaseInfo,
  DatabaseOverview,
  IndexInfo,
  SchemaInfo,
  TableDataResult,
  TableInfo,
} from "@/types/database"
import type { ServerConfig } from "@/types/database"
import { getPool } from "./pool"

export async function getServerVersion(config: ServerConfig): Promise<string> {
  const pool = getPool(config)
  const result = await pool.query("SELECT version()")
  return result.rows[0]?.version ?? "Unknown"
}

export async function getDatabases(
  config: ServerConfig,
): Promise<DatabaseInfo[]> {
  const pool = getPool(config)
  const result = await pool.query<DatabaseInfo>(`
    SELECT
      d.datname AS name,
      pg_catalog.pg_get_userbyid(d.datdba) AS owner,
      pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(d.datname)) AS size,
      pg_catalog.pg_encoding_to_char(d.encoding) AS encoding
    FROM pg_catalog.pg_database d
    WHERE d.datistemplate = false
    ORDER BY d.datname
  `)
  return result.rows
}

export async function getDatabaseOverview(
  config: ServerConfig,
  databaseName: string,
): Promise<DatabaseOverview> {
  const pool = getPool(config, databaseName)

  const [versionResult, sizeResult, schemasResult] = await Promise.all([
    pool.query("SELECT version()"),
    pool.query(
      "SELECT pg_size_pretty(pg_database_size(current_database())) AS size",
    ),
    pool.query<SchemaInfo>(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `),
  ])

  return {
    version: versionResult.rows[0]?.version ?? "Unknown",
    database_size: sizeResult.rows[0]?.size ?? "Unknown",
    schemas: schemasResult.rows,
  }
}

export async function getSchemas(
  config: ServerConfig,
  databaseName: string,
): Promise<SchemaInfo[]> {
  const pool = getPool(config, databaseName)
  const result = await pool.query<SchemaInfo>(`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name
  `)
  return result.rows
}

export async function getTables(
  config: ServerConfig,
  databaseName: string,
  schema: string,
): Promise<TableInfo[]> {
  const pool = getPool(config, databaseName)
  const result = await pool.query<TableInfo>(
    `
    SELECT
      t.table_name,
      t.table_type,
      COALESCE(c.reltuples, 0)::bigint AS row_estimate
    FROM information_schema.tables t
    LEFT JOIN pg_catalog.pg_class c
      ON c.relname = t.table_name
      AND c.relnamespace = (
        SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = t.table_schema
      )
    WHERE t.table_schema = $1
      AND t.table_type IN ('BASE TABLE', 'VIEW')
    ORDER BY t.table_type, t.table_name
    `,
    [schema],
  )
  return result.rows
}

export async function getColumns(
  config: ServerConfig,
  databaseName: string,
  schema: string,
  table: string,
): Promise<ColumnInfo[]> {
  const pool = getPool(config, databaseName)
  const result = await pool.query<ColumnInfo>(
    `
    SELECT
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default,
      ordinal_position,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
    `,
    [schema, table],
  )
  return result.rows
}

export async function getIndexes(
  config: ServerConfig,
  databaseName: string,
  schema: string,
  table: string,
): Promise<IndexInfo[]> {
  const pool = getPool(config, databaseName)
  const result = await pool.query<IndexInfo>(
    `
    SELECT
      i.relname AS index_name,
      pg_get_indexdef(ix.indexrelid) AS index_definition,
      ix.indisunique AS is_unique,
      ix.indisprimary AS is_primary
    FROM pg_catalog.pg_index ix
    JOIN pg_catalog.pg_class i ON i.oid = ix.indexrelid
    JOIN pg_catalog.pg_class t ON t.oid = ix.indrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = $1 AND t.relname = $2
    ORDER BY i.relname
    `,
    [schema, table],
  )
  return result.rows
}

export async function getConstraints(
  config: ServerConfig,
  databaseName: string,
  schema: string,
  table: string,
): Promise<ConstraintInfo[]> {
  const pool = getPool(config, databaseName)
  const result = await pool.query<ConstraintInfo>(
    `
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      array_to_json(array_agg(DISTINCT kcu.column_name ORDER BY kcu.column_name)) AS column_names,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      array_to_json(array_agg(DISTINCT ccu.column_name ORDER BY ccu.column_name)
        FILTER (WHERE tc.constraint_type = 'FOREIGN KEY')) AS foreign_column_names
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
      AND kcu.table_schema = tc.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND tc.constraint_type = 'FOREIGN KEY'
    WHERE tc.table_schema = $1 AND tc.table_name = $2
    GROUP BY tc.constraint_name, tc.constraint_type,
             ccu.table_schema, ccu.table_name
    ORDER BY tc.constraint_type, tc.constraint_name
    `,
    [schema, table],
  )
  return result.rows
}

export async function getTableData(
  config: ServerConfig,
  databaseName: string,
  schema: string,
  table: string,
  options: {
    page?: number
    pageSize?: number
    sortColumn?: string
    sortDirection?: "asc" | "desc"
    filters?: Record<string, string>
  } = {},
): Promise<TableDataResult> {
  const pool = getPool(config, databaseName)
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25))
  const offset = (page - 1) * pageSize

  const columns = await getColumns(config, databaseName, schema, table)
  const validColumns = new Set(columns.map((c) => c.column_name))

  const whereClauses: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (options.filters) {
    for (const [col, value] of Object.entries(options.filters)) {
      if (validColumns.has(col) && value.trim() !== "") {
        whereClauses.push(`${quoteIdent(col)}::text ILIKE $${paramIndex}`)
        params.push(`%${value}%`)
        paramIndex++
      }
    }
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

  let orderSQL = ""
  if (options.sortColumn && validColumns.has(options.sortColumn)) {
    const dir = options.sortDirection === "desc" ? "DESC" : "ASC"
    orderSQL = `ORDER BY ${quoteIdent(options.sortColumn)} ${dir} NULLS LAST`
  }

  const qualifiedTable = `${quoteIdent(schema)}.${quoteIdent(table)}`

  const countQuery = `SELECT COUNT(*) AS total FROM ${qualifiedTable} ${whereSQL}`
  const countResult = await pool.query(countQuery, params)
  const totalRows = parseInt(countResult.rows[0]?.total ?? "0", 10)

  const dataQuery = `
    SELECT * FROM ${qualifiedTable}
    ${whereSQL}
    ${orderSQL}
    LIMIT ${pageSize} OFFSET ${offset}
  `
  const dataResult = await pool.query(dataQuery, params)

  return {
    columns: dataResult.fields.map((f) => f.name),
    rows: dataResult.rows,
    totalRows,
    page,
    pageSize,
  }
}

export async function createDatabase(
  config: ServerConfig,
  name: string,
): Promise<void> {
  const client = new pg.Client({
    host: config.host,
    port: config.port,
    database: "postgres",
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
  })

  await client.connect()
  try {
    await client.query(`CREATE DATABASE ${quoteIdent(name)}`)
  } finally {
    await client.end()
  }
}

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}
