import { notFound } from "next/navigation"
import { Server } from "lucide-react"
import { getServerConfig } from "@/lib/db/config"
import { getDatabases, getServerVersion } from "@/lib/db/queries"
import { CreateDatabaseDialog } from "@/components/create-database-dialog"
import { DatabaseCard } from "@/components/db-card"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

export default async function ServerPage({
  params,
}: {
  params: Promise<{ serverId: string }>
}) {
  const { serverId } = await params
  const config = getServerConfig(serverId)

  if (!config) {
    notFound()
  }

  let version: string | null = null
  let databases: Awaited<ReturnType<typeof getDatabases>> = []
  let error: string | null = null

  try {
    ;[version, databases] = await Promise.all([
      getServerVersion(config),
      getDatabases(config),
    ])
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to connect to server"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Server className="text-muted-foreground h-5 w-5" />
              <h1 className="text-2xl font-bold tracking-tight">
                {config.name}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              {config.host}:{config.port}
            </p>
          </div>

          {error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Version</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {version?.split(",")[0] ?? "Unknown"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Databases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{databases.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Connection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {config.user}@{config.host}
                      </span>
                      {config.ssl && <Badge variant="outline">SSL</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Databases
                  </h2>
                  <CreateDatabaseDialog serverId={serverId} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {databases.map((db) => (
                    <DatabaseCard
                      key={db.name}
                      serverId={serverId}
                      database={db}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
