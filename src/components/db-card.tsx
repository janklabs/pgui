import Link from "next/link"
import { Database, HardDrive, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DatabaseInfo } from "@/types/database"

interface DatabaseCardProps {
  serverId: string
  database: DatabaseInfo
}

export function DatabaseCard({ serverId, database }: DatabaseCardProps) {
  return (
    <Link href={`/server/${serverId}/db/${encodeURIComponent(database.name)}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-500" />
            <CardTitle className="text-base">{database.name}</CardTitle>
          </div>
          <CardDescription className="text-xs">
            <Badge
              variant="outline"
              className="border-sky-500/30 font-mono text-[10px] text-sky-600 dark:text-sky-400"
            >
              {database.encoding}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3 text-amber-500" />
              {database.size}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 text-teal-500" />
              {database.owner}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
