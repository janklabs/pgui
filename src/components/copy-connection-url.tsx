"use client"

import { useCallback, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CopyConnectionUrlProps {
  host: string
  port: number
  user: string
  password: string
  ssl: boolean
  dbName: string
}

function buildConnectionUrl({
  host,
  port,
  user,
  password,
  ssl,
  dbName,
}: CopyConnectionUrlProps): string {
  const encodedUser = encodeURIComponent(user)
  const encodedPassword = encodeURIComponent(password)
  const base = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${encodeURIComponent(dbName)}`
  return ssl ? `${base}?sslmode=require` : base
}

export function CopyConnectionUrl(props: CopyConnectionUrlProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const url = buildConnectionUrl(props)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [props])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <span className="relative inline-flex items-center">
            <span
              className="inline-flex items-center transition-opacity duration-200"
              style={{ opacity: copied ? 0 : 1 }}
            >
              <Copy className="mr-1.5 h-4 w-4" />
              Copy Connection URL
            </span>
            <span
              className="absolute inset-0 inline-flex items-center justify-center transition-opacity duration-200"
              style={{ opacity: copied ? 1 : 0 }}
            >
              <Check className="mr-1.5 h-4 w-4 text-emerald-500" />
              Copied!
            </span>
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy connection URL to clipboard</TooltipContent>
    </Tooltip>
  )
}
