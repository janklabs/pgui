import type { Metadata } from "next"

import { getServerConfigs } from "@/lib/db/config"
import { testConnection } from "@/lib/db/pool"
import { Header } from "@/components/header"
import { NoServersConfigured } from "@/components/no-servers"
import { ServerCard } from "@/components/server-card"

export const metadata: Metadata = {
  title: {
    absolute: "servers · pgui",
  },
}

export default async function HomePage() {
  const configs = await getServerConfigs()

  if (configs.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <NoServersConfigured />
      </div>
    )
  }

  const statuses = await Promise.all(
    configs.map(async (config) => {
      if (config.configError) {
        return { config, status: { ok: false, error: config.configError } }
      }
      const status = await testConnection(config)
      return { config, status }
    }),
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Servers</h1>
            <p className="text-muted-foreground text-sm">
              Select a server to browse its databases.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statuses.map(({ config, status }) => (
              <ServerCard key={config.id} config={config} status={status} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
