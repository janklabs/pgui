"use client"

import { useCallback, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ColumnInfo } from "@/types/database"

interface DataTableProps {
  columns: string[]
  columnInfo: ColumnInfo[]
  rows: Record<string, unknown>[]
  totalRows: number
  page: number
  pageSize: number
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  filters: Record<string, string>
}

export function DataTable({
  columns,
  columnInfo,
  rows,
  totalRows,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  filters,
}: DataTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      return params.toString()
    },
    [searchParams],
  )

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const qs = createQueryString(updates)
      router.push(`${pathname}?${qs}`)
    },
    [createQueryString, pathname, router],
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        navigate({ sort: column, dir: "desc", page: "1" })
      } else {
        navigate({ sort: null, dir: null, page: "1" })
      }
    } else {
      navigate({ sort: column, dir: "asc", page: "1" })
    }
  }

  const handlePageChange = (newPage: number) => {
    navigate({ page: String(newPage) })
  }

  const handlePageSizeChange = (newSize: string) => {
    navigate({ pageSize: newSize, page: "1" })
  }

  const columnTypeMap = new Map(columnInfo.map((c) => [c.column_name, c]))

  return (
    <div className="space-y-4">
      <FilterBar
        columns={columns}
        filters={filters}
        onFilterChange={(col, value) => {
          navigate({
            [`f_${col}`]: value || null,
            page: "1",
          })
        }}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const info = columnTypeMap.get(col)
                return (
                  <TableHead key={col} className="whitespace-nowrap">
                    <button
                      className="hover:text-foreground flex items-center gap-1"
                      onClick={() => handleSort(col)}
                    >
                      <span>{col}</span>
                      {sortColumn === col ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                      )}
                      {info && (
                        <Badge
                          variant="outline"
                          className="ml-1 border-sky-500/30 font-mono text-[10px] font-normal text-sky-600 dark:text-sky-400"
                        >
                          {info.udt_name}
                        </Badge>
                      )}
                    </button>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="max-w-xs truncate font-mono text-xs"
                    >
                      <CellValue value={row[col]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>
            {totalRows.toLocaleString()} row{totalRows !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterBar({
  columns,
  filters,
  onFilterChange,
}: {
  columns: string[]
  filters: Record<string, string>
  onFilterChange: (column: string, value: string) => void
}) {
  const [filterColumn, setFilterColumn] = useState("")
  const [filterValue, setFilterValue] = useState("")

  const activeFilters = Object.entries(filters).filter(
    ([, v]) => v.trim() !== "",
  )

  const handleAddFilter = () => {
    if (filterValue.trim()) {
      const col = filterColumn || "__all"
      onFilterChange(col, filterValue.trim())
      setFilterValue("")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={filterColumn} onValueChange={setFilterColumn}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder="Filter column..." />
          </SelectTrigger>
          <SelectContent>
            {columns.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="h-8 w-[200px]"
          placeholder="Contains..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddFilter()
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleAddFilter}
          disabled={!filterValue.trim()}
        >
          Filter
        </Button>
      </div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map(([col, value]) => (
            <Badge
              key={col}
              variant="secondary"
              className="gap-1 bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
            >
              <span className="font-medium">
                {col === "__all" ? "Any column" : col}
              </span>
              <span className="text-muted-foreground">contains</span>
              <span>&quot;{value}&quot;</span>
              <button
                onClick={() => onFilterChange(col, "")}
                className="hover:text-foreground ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => {
              activeFilters.forEach(([col]) => onFilterChange(col, ""))
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

function CellValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-rose-400/70 italic">NULL</span>
  }
  if (typeof value === "boolean") {
    return (
      <Badge
        variant={value ? "default" : "secondary"}
        className={value ? "" : "text-rose-500 dark:text-rose-400"}
      >
        {String(value)}
      </Badge>
    )
  }
  if (typeof value === "object") {
    return (
      <span title={JSON.stringify(value, null, 2)}>
        {JSON.stringify(value)}
      </span>
    )
  }
  return <span title={String(value)}>{String(value)}</span>
}
