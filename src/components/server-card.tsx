import Link from "next/link"
import { AlertTriangle, CheckCircle2, Server, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ServerConfig } from "@/types/database"

interface ServerCardProps {
  config: ServerConfig
  status: { ok: boolean; error?: string; latencyMs?: number }
}

export function ServerCard({ config, status }: ServerCardProps) {
  if (config.configError) {
    return (
      <Link href={`/server/${config.id}`}>
        <Card className="border-destructive/50 hover:border-destructive transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-base">
                  {config.displayName}
                </CardTitle>
              </div>
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Bad Config
              </Badge>
            </div>
            <CardDescription className="font-mono text-xs">
              {config.host}:{config.port}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-xs">{config.configError}</p>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/server/${config.id}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-500" />
              <CardTitle className="text-base">{config.displayName}</CardTitle>
            </div>
            {status.ok ? (
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                Error
              </Badge>
            )}
          </div>
          <CardDescription className="font-mono text-xs">
            {config.host}:{config.port}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span>User: {config.user}</span>
            {status.ok && status.latencyMs !== undefined && (
              <span className="text-cyan-600 dark:text-cyan-400">
                {status.latencyMs}ms
              </span>
            )}
            {config.ssl && (
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              >
                SSL
              </Badge>
            )}
          </div>
          {!status.ok && status.error && (
            <p className="text-destructive mt-2 text-xs">{status.error}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
