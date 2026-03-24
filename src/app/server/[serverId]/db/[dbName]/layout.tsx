import Link from "next/link"
import { notFound } from "next/navigation"
import { Database } from "lucide-react"

import { getServerConfig } from "@/lib/db/config"
import { getSchemas } from "@/lib/db/queries"
import { Header } from "@/components/header"
import { ResizableSidebar } from "@/components/resizable-sidebar"
import { SchemaTree } from "@/components/schema-tree"
import { Separator } from "@/components/ui/separator"

export default async function DatabaseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ serverId: string; dbName: string }>
}) {
  const { serverId, dbName } = await params
  const decodedDbName = decodeURIComponent(dbName)
  const config = await getServerConfig(serverId)

  if (!config) {
    notFound()
  }

  let schemas: { schema_name: string }[] = []
  let error: string | null = null

  try {
    schemas = await getSchemas(config, decodedDbName)
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load schemas"
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ResizableSidebar>
          <div className="flex items-center gap-2 px-4 py-3">
            <Database className="h-4 w-4 shrink-0 text-violet-500" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {decodedDbName}
              </div>
              <Link
                href={`/server/${serverId}`}
                className="text-muted-foreground hover:text-foreground truncate font-mono text-xs transition-colors"
              >
                {config.displayName} &middot; {config.host}:{config.port}
              </Link>
            </div>
          </div>
          <Separator />
          {error ? (
            <div className="text-destructive p-4 text-xs">{error}</div>
          ) : (
            <SchemaTree
              serverId={serverId}
              dbName={decodedDbName}
              schemas={schemas}
            />
          )}
        </ResizableSidebar>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
