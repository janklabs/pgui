import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getServerConfig } from "@/lib/db/config"
import { getDatabaseOverview } from "@/lib/db/queries"
import { CopyConnectionUrl } from "@/components/copy-connection-url"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serverId: string; dbName: string }>
}): Promise<Metadata> {
  const { serverId, dbName } = await params
  const config = await getServerConfig(serverId)
  return {
    title: `${decodeURIComponent(dbName)} · ${config?.name ?? "Server"}`,
  }
}

export default async function DatabasePage({
  params,
}: {
  params: Promise<{ serverId: string; dbName: string }>
}) {
  const { serverId, dbName } = await params
  const decodedDbName = decodeURIComponent(dbName)
  const config = await getServerConfig(serverId)

  if (!config) {
    notFound()
  }

  let overview
  let error: string | null = null

  try {
    overview = await getDatabaseOverview(config, decodedDbName)
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load overview"
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{decodedDbName}</h1>
          <p className="text-muted-foreground text-sm">Database overview</p>
        </div>
        <CopyConnectionUrl
          host={config.host}
          port={config.port}
          user={config.user}
          password={config.password}
          ssl={config.ssl}
          dbName={decodedDbName}
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Version</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{overview.version.split(",")[0]}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Database Size</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {overview.database_size}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Schemas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {overview.schemas.map((s) => (
                  <Badge
                    key={s.schema_name}
                    variant="secondary"
                    className={
                      s.schema_name === "public"
                        ? "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                        : "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                    }
                  >
                    {s.schema_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
