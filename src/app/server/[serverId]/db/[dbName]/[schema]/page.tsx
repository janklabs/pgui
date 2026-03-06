import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Eye, Table2 } from "lucide-react"
import { getServerConfig } from "@/lib/db/config"
import { getTables } from "@/lib/db/queries"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serverId: string; dbName: string; schema: string }>
}): Promise<Metadata> {
  const { dbName, schema } = await params
  return {
    title: `${decodeURIComponent(schema)} · ${decodeURIComponent(dbName)}`,
  }
}

export default async function SchemaPage({
  params,
}: {
  params: Promise<{ serverId: string; dbName: string; schema: string }>
}) {
  const { serverId, dbName, schema } = await params
  const decodedDbName = decodeURIComponent(dbName)
  const decodedSchema = decodeURIComponent(schema)
  const config = await getServerConfig(serverId)

  if (!config) {
    notFound()
  }

  let tables
  let error: string | null = null

  try {
    tables = await getTables(config, decodedDbName, decodedSchema)
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load tables"
  }

  const baseTables = tables?.filter((t) => t.table_type === "BASE TABLE") ?? []
  const views = tables?.filter((t) => t.table_type === "VIEW") ?? []

  const baseUrl = `/server/${serverId}/db/${encodeURIComponent(decodedDbName)}/${encodeURIComponent(decodedSchema)}`

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{decodedSchema}</h1>
        <p className="text-muted-foreground text-sm">
          {tables
            ? `${baseTables.length} table${baseTables.length !== 1 ? "s" : ""}${views.length > 0 ? `, ${views.length} view${views.length !== 1 ? "s" : ""}` : ""}`
            : "Schema"}
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {baseTables.length > 0 && (
            <div>
              <h2 className="text-muted-foreground mb-3 text-sm font-medium tracking-wider uppercase">
                Tables
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {baseTables.map((table) => (
                  <Link
                    key={table.table_name}
                    href={`${baseUrl}/${encodeURIComponent(table.table_name)}`}
                  >
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Table2 className="h-4 w-4 text-orange-500" />
                          <CardTitle className="text-sm">
                            {table.table_name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          ~{formatRowCount(table.row_estimate)} rows
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {views.length > 0 && (
            <div>
              <h2 className="text-muted-foreground mb-3 text-sm font-medium tracking-wider uppercase">
                Views
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {views.map((view) => (
                  <Link
                    key={view.table_name}
                    href={`${baseUrl}/${encodeURIComponent(view.table_name)}`}
                  >
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-cyan-500" />
                          <CardTitle className="text-sm">
                            {view.table_name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Badge
                          variant="outline"
                          className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
                        >
                          View
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tables && tables.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm">
                  This schema has no tables or views.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}
