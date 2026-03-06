"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, Columns3, Eye, Loader2, Table2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TableInfo } from "@/types/database"

interface SchemaTreeProps {
  serverId: string
  dbName: string
  schemas: { schema_name: string }[]
}

export function SchemaTree({ serverId, dbName, schemas }: SchemaTreeProps) {
  const params = useParams()
  const activeSchema = params.schema as string | undefined
  const activeTable = params.table as string | undefined

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <div className="text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wider uppercase">
          Schemas
        </div>
        {schemas.map((schema) => (
          <SchemaNode
            key={schema.schema_name}
            serverId={serverId}
            dbName={dbName}
            schemaName={schema.schema_name}
            isActive={activeSchema === schema.schema_name}
            activeTable={
              activeSchema === schema.schema_name ? activeTable : undefined
            }
          />
        ))}
      </div>
    </ScrollArea>
  )
}

function SchemaNode({
  serverId,
  dbName,
  schemaName,
  isActive,
  activeTable,
}: {
  serverId: string
  dbName: string
  schemaName: string
  isActive: boolean
  activeTable?: string
}) {
  const [open, setOpen] = useState(isActive)
  const [tables, setTables] = useState<TableInfo[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isActive) {
      setOpen(true)
    }
  }, [isActive])

  const handleToggle = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && tables === null) {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/server/${serverId}/db/${encodeURIComponent(dbName)}/schemas/${encodeURIComponent(schemaName)}/tables`,
        )
        if (res.ok) {
          const data = await res.json()
          setTables(data)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
  }

  const baseUrl = `/server/${serverId}/db/${encodeURIComponent(dbName)}`

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <CollapsibleTrigger asChild>
        <button
          className={`hover:bg-accent flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
            isActive && !activeTable ? "bg-accent font-medium" : ""
          }`}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          />
          <Columns3 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{schemaName}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-3 border-l pl-2">
          {loading && (
            <div className="text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          )}
          {tables?.map((table) => (
            <Link
              key={table.table_name}
              href={`${baseUrl}/${encodeURIComponent(schemaName)}/${encodeURIComponent(table.table_name)}`}
              className={`hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
                activeTable === table.table_name ? "bg-accent font-medium" : ""
              }`}
            >
              {table.table_type === "VIEW" ? (
                <Eye className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              ) : (
                <Table2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{table.table_name}</span>
              {table.row_estimate > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto shrink-0 text-[10px]"
                >
                  ~{formatRowCount(table.row_estimate)}
                </Badge>
              )}
            </Link>
          ))}
          {tables !== null && tables.length === 0 && (
            <div className="text-muted-foreground px-2 py-1.5 text-xs">
              No tables
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}
