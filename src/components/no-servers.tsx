import { Server, Terminal } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function NoServersConfigured() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-amber-500" />
            <CardTitle>No Servers Configured</CardTitle>
          </div>
          <CardDescription>
            Configure one or more PostgreSQL servers using environment variables
            to get started. The app will discover databases on each server
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md border-l-4 border-l-emerald-500 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground text-xs font-medium">
                Environment Variables
              </span>
            </div>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
              {`# Server 1
DB_1_NAME=production
DB_1_HOST=localhost
DB_1_PORT=5432
DB_1_USER=readonly
DB_1_PASSWORD=secret
DB_1_SSL=false

# Server 2
DB_2_NAME=staging
DB_2_HOST=staging.internal
DB_2_PORT=5432
DB_2_USER=readonly
DB_2_PASSWORD=secret2
DB_2_SSL=true`}
            </pre>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            Set these in your{" "}
            <code className="bg-muted rounded px-1">.env.local</code> file or
            pass them via Docker environment configuration. The app connects to
            the <code className="bg-muted rounded px-1">postgres</code>{" "}
            maintenance database to discover all databases on each server.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
