"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Loader } from "@/components/ui/loader"

export function SearchCombobox<T>({
  label,
  placeholder,
  displayValue,
  hasValue,
  search,
  getResultKey,
  renderResult,
  onSelect,
  onClear,
  className,
}: {
  label: string
  placeholder: string
  /** Text shown in the input once a selection has been applied. */
  displayValue: string
  hasValue: boolean
  search: (query: string) => Promise<T[]>
  getResultKey: (item: T) => string
  renderResult: (item: T) => ReactNode
  onSelect: (item: T) => void
  onClear: () => void
  className?: string
}) {
  const [query, setQuery] = useState(displayValue)
  const [syncedDisplayValue, setSyncedDisplayValue] = useState(displayValue)
  const [results, setResults] = useState<T[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  if (displayValue !== syncedDisplayValue) {
    setSyncedDisplayValue(displayValue)
    setQuery(displayValue)
  }

  useEffect(() => {
    if (query.trim().length < 2 || query === displayValue) {
      return
    }

    const timeout = setTimeout(() => {
      setLoading(true)
      setOpen(true)
      search(query.trim())
        .then((items) => {
          setResults(items)
        })
        .catch(() => {
          setResults([])
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    if (!open) return

    function updateRect() {
      const rect = fieldRef.current?.getBoundingClientRect()
      if (rect) {
        setMenuRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 288) })
      }
    }

    updateRect()
    window.addEventListener("scroll", updateRect, true)
    window.addEventListener("resize", updateRect)
    return () => {
      window.removeEventListener("scroll", updateRect, true)
      window.removeEventListener("resize", updateRect)
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const insideContainer = containerRef.current?.contains(target) ?? false
      const insideMenu = menuRef.current?.contains(target) ?? false
      if (!insideContainer && !insideMenu) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(item: T) {
    setOpen(false)
    setResults([])
    onSelect(item)
  }

  function handleClear() {
    setQuery("")
    setResults([])
    setOpen(false)
    onClear()
  }

  const showMenu = open && query.trim().length >= 2

  return (
    <div ref={containerRef} className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div ref={fieldRef} className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-7 pr-6"
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={`Clear ${label.toLowerCase()} filter`}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showMenu &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            className="z-50 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            {loading ? (
              <div className="flex items-center justify-center px-3 py-3">
                <Loader size="sm" />
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-2 text-muted-foreground">No results.</div>
            ) : (
              <ul className="max-h-64 overflow-y-auto py-1">
                {results.map((item) => (
                  <li key={getResultKey(item)}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
                    >
                      {renderResult(item)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
