"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, Loader2, Table2 } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface NavigationItem {
  serverId: string
  serverName: string
  dbName: string
  schema: string
  tableName: string
  tableType: "BASE TABLE" | "VIEW"
}

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NavigationItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  // Listen for Ctrl+K / ⌘+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Listen for custom event from header button
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    document.addEventListener("open-command-menu", handleOpen)
    return () => document.removeEventListener("open-command-menu", handleOpen)
  }, [])

  // Fetch navigation index on first open
  const fetchItems = useCallback(async () => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    setLoading(true)
    try {
      const res = await fetch("/api/search")
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch {
      // Silently fail — user can retry by reopening
      fetchedRef.current = false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && items === null) {
      fetchItems()
    }
  }, [open, items, fetchItems])

  const handleSelect = useCallback(
    (item: NavigationItem) => {
      setOpen(false)
      router.push(
        `/server/${item.serverId}/db/${encodeURIComponent(item.dbName)}/${encodeURIComponent(item.schema)}/${encodeURIComponent(item.tableName)}`,
      )
    },
    [router],
  )

  // Group items by server
  const groupedItems = items
    ? items.reduce<Record<string, NavigationItem[]>>((acc, item) => {
        const key = `${item.serverId}:${item.serverName}`
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
      }, {})
    : {}

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search for tables and views across all servers"
      showCloseButton={false}
    >
      <CommandInput placeholder="Search tables and views..." />
      <CommandList>
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedItems).map(([key, serverItems]) => {
              const serverName = key.split(":").slice(1).join(":")
              return (
                <CommandGroup key={key} heading={serverName}>
                  {serverItems.map((item) => (
                    <CommandItem
                      key={`${item.serverId}-${item.dbName}-${item.schema}-${item.tableName}`}
                      value={`${item.tableName} ${item.dbName} ${item.schema} ${item.serverName}`}
                      onSelect={() => handleSelect(item)}
                    >
                      {item.tableType === "VIEW" ? (
                        <Eye className="h-4 w-4 shrink-0 text-cyan-500" />
                      ) : (
                        <Table2 className="h-4 w-4 shrink-0 text-orange-500" />
                      )}
                      <span className="truncate font-medium">
                        {item.tableName}
                      </span>
                      <span className="text-muted-foreground ml-auto truncate text-xs">
                        {item.dbName} &rsaquo; {item.schema}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
