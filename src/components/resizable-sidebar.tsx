"use client"

import { useCallback, useRef, useState } from "react"

const MIN_WIDTH = 200
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 256

interface ResizableSidebarProps {
  children: React.ReactNode
}

export function ResizableSidebar({ children }: ResizableSidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const sidebarRef = useRef<HTMLElement>(null)
  const dragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const startX = e.clientX
    const startWidth = sidebarRef.current?.offsetWidth ?? DEFAULT_WIDTH

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragging.current) return
      const newWidth = startWidth + (moveEvent.clientX - startX)
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)))
    }

    const handleMouseUp = () => {
      dragging.current = false
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }, [])

  return (
    <aside
      ref={sidebarRef}
      style={{ width }}
      className="bg-muted/30 relative flex shrink-0 flex-col border-r"
    >
      {children}
      <div
        onMouseDown={handleMouseDown}
        className="hover:bg-primary/20 active:bg-primary/40 absolute top-0 right-0 bottom-0 w-1 cursor-col-resize"
      />
    </aside>
  )
}
