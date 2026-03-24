"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SearchTrigger() {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"))
  }, [])

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-muted-foreground h-8 gap-2 text-xs"
      onClick={() =>
        document.dispatchEvent(new CustomEvent("open-command-menu"))
      }
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="bg-muted pointer-events-none hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
        {isMac ? "⌘" : "Ctrl"}K
      </kbd>
    </Button>
  )
}
