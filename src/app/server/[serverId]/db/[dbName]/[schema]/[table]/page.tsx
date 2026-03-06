import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Eye, Key, Link2, Table2 } from "lucide-react"
import { getServerConfig } from "@/lib/db/config"
import {
  getColumns,
  getConstraints,
  getIndexes,
  getTableData,
  getTables,
} from "@/lib/db/queries"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { ColumnInfo, ConstraintInfo, IndexInfo } from "@/types/database"

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{
    serverId: string
    dbName: string
    schema: string
    table: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { serverId, dbName, schema, table } = await params
  const sp = await searchParams
  const decodedDbName = decodeURIComponent(dbName)
  const decodedSchema = decodeURIComponent(schema)
  const decodedTable = decodeURIComponent(table)
  const config = getServerConfig(serverId)

  if (!config) {
    notFound()
  }

  const tables = await getTables(config, decodedDbName, decodedSchema)
  const tableInfo = tables.find((t) => t.table_name === decodedTable)
  if (!tableInfo) {
    notFound()
  }

  const isView = tableInfo.table_type === "VIEW"

  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10))
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(sp.pageSize ?? "25"), 10)),
  )
  const sortColumn = sp.sort ? String(sp.sort) : undefined
  const sortDirection = sp.dir === "desc" ? ("desc" as const) : ("asc" as const)

  const filters: Record<string, string> = {}
  for (const [key, value] of Object.entries(sp)) {
    if (key.startsWith("f_") && typeof value === "string" && value.trim()) {
      filters[key.slice(2)] = value
    }
  }

  const [columnInfo, indexInfo, constraintInfo, tableData] = await Promise.all([
    getColumns(config, decodedDbName, decodedSchema, decodedTable),
    !isView
      ? getIndexes(config, decodedDbName, decodedSchema, decodedTable)
      : Promise.resolve([]),
    !isView
      ? getConstraints(config, decodedDbName, decodedSchema, decodedTable)
      : Promise.resolve([]),
    getTableData(config, decodedDbName, decodedSchema, decodedTable, {
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
    }),
  ])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start gap-3">
        {isView ? (
          <Eye className="text-muted-foreground mt-1 h-5 w-5" />
        ) : (
          <Table2 className="text-muted-foreground mt-1 h-5 w-5" />
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{decodedTable}</h1>
          <p className="text-muted-foreground text-sm">
            {decodedSchema}
            {isView ? " (view)" : ""} &middot;{" "}
            {tableData.totalRows.toLocaleString()} rows &middot;{" "}
            {columnInfo.length} columns
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <ColumnsCard columns={columnInfo} />
        {!isView && indexInfo.length > 0 && <IndexesCard indexes={indexInfo} />}
        {!isView && constraintInfo.length > 0 && (
          <ConstraintsCard constraints={constraintInfo} />
        )}
      </div>

      <Separator className="mb-6" />

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <DataTable
          columns={tableData.columns}
          columnInfo={columnInfo}
          rows={tableData.rows}
          totalRows={tableData.totalRows}
          page={tableData.page}
          pageSize={tableData.pageSize}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          filters={filters}
        />
      </Suspense>
    </div>
  )
}

function ColumnsCard({ columns }: { columns: ColumnInfo[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Columns</CardTitle>
        <CardDescription>{columns.length} columns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {columns.map((col) => (
            <div
              key={col.column_name}
              className="flex items-center justify-between text-xs"
            >
              <span className="font-mono">{col.column_name}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {col.udt_name}
                  {col.character_maximum_length
                    ? `(${col.character_maximum_length})`
                    : ""}
                </Badge>
                {col.is_nullable === "NO" && (
                  <Badge variant="secondary" className="text-[10px]">
                    NOT NULL
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function IndexesCard({ indexes }: { indexes: IndexInfo[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Indexes</CardTitle>
        <CardDescription>{indexes.length} indexes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {indexes.map((idx) => (
            <div key={idx.index_name} className="text-xs">
              <div className="flex items-center gap-1.5">
                {idx.is_primary && <Key className="h-3 w-3 text-amber-500" />}
                <span className="font-mono font-medium">{idx.index_name}</span>
                {idx.is_unique && !idx.is_primary && (
                  <Badge variant="secondary" className="text-[10px]">
                    UNIQUE
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ConstraintsCard({ constraints }: { constraints: ConstraintInfo[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Constraints</CardTitle>
        <CardDescription>{constraints.length} constraints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {constraints.map((con) => (
            <div key={con.constraint_name} className="text-xs">
              <div className="flex items-center gap-1.5">
                {con.constraint_type === "PRIMARY KEY" && (
                  <Key className="h-3 w-3 text-amber-500" />
                )}
                {con.constraint_type === "FOREIGN KEY" && (
                  <Link2 className="h-3 w-3 text-blue-500" />
                )}
                <span className="font-mono font-medium">
                  {con.constraint_name}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {con.constraint_type}
                </Badge>
              </div>
              <div className="text-muted-foreground mt-0.5 pl-4">
                ({con.column_names.join(", ")})
                {con.foreign_table_name && (
                  <span>
                    {" "}
                    &rarr; {con.foreign_table_schema}.{con.foreign_table_name}(
                    {con.foreign_column_names?.join(", ")})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
