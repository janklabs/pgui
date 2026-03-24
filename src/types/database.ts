export interface ServerConfig {
  id: string
  displayName: string
  host: string
  port: number
  user: string
  password: string
  ssl: boolean
  autodiscover: boolean
  databases: string[] | null
  configError?: string
}

export interface DatabaseInfo {
  name: string
  owner: string
  size: string
  encoding: string
}

export interface SchemaInfo {
  schema_name: string
}

export interface TableInfo {
  table_name: string
  table_type: "BASE TABLE" | "VIEW"
  row_estimate: number
}

export interface ColumnInfo {
  column_name: string
  data_type: string
  udt_name: string
  is_nullable: "YES" | "NO"
  column_default: string | null
  ordinal_position: number
  character_maximum_length: number | null
}

export interface IndexInfo {
  index_name: string
  index_definition: string
  is_unique: boolean
  is_primary: boolean
}

export interface ConstraintInfo {
  constraint_name: string
  constraint_type: string
  column_names: string[]
  foreign_table_schema: string | null
  foreign_table_name: string | null
  foreign_column_names: string[] | null
}

export interface TableDataResult {
  columns: string[]
  rows: Record<string, unknown>[]
  totalRows: number
  page: number
  pageSize: number
}

export interface DatabaseOverview {
  version: string
  database_size: string
  schemas: SchemaInfo[]
}
