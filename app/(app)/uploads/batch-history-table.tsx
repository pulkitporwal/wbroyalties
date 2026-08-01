"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress, ProgressValue } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { deleteBatch } from "./actions"

export type BatchRow = {
  id: string
  fileName: string
  uploadedByName: string
  rowCount: number
  skippedRowCount: number
  vendorsCreated: number
  totalRowCount: number
  processedRowCount: number
  status: "processing" | "completed" | "failed"
  errorMessage?: string | null
  createdAt: string
}

type StatusResponse = {
  status: BatchRow["status"]
  rowCount: number
  skippedRowCount: number
  vendorsCreated: number
  totalRowCount: number
  processedRowCount: number
  errorMessage: string | null
}

const statusVariant: Record<BatchRow["status"], "secondary" | "outline" | "destructive"> = {
  completed: "secondary",
  processing: "outline",
  failed: "destructive",
}

export function BatchHistoryTable({ batches }: { batches: BatchRow[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<BatchRow | null>(null)
  const [isPending, startTransition] = useTransition()
  const [liveStatus, setLiveStatus] = useState<Record<string, StatusResponse>>({})

  const processingIds = batches
    .filter((batch) => (liveStatus[batch.id]?.status ?? batch.status) === "processing")
    .map((batch) => batch.id)
    .join(",")

  useEffect(() => {
    if (!processingIds) return

    let cancelled = false

    async function poll() {
      const ids = processingIds.split(",")
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/uploads/${id}/status`, { cache: "no-store" })
            if (!res.ok) return null
            const data: StatusResponse = await res.json()
            return [id, data] as const
          } catch {
            return null
          }
        })
      )
      if (cancelled) return

      let anyFinished = false
      setLiveStatus((prev) => {
        const next = { ...prev }
        for (const entry of results) {
          if (!entry) continue
          const [id, data] = entry
          next[id] = data
          if (data.status !== "processing") anyFinished = true
        }
        return next
      })

      if (anyFinished) router.refresh()
    }

    void poll()
    const interval = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [processingIds, router])

  const rows = batches.map((batch) => ({ ...batch, ...liveStatus[batch.id] }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload history</CardTitle>
        <CardDescription>Past report imports, most recent first.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Rows imported</TableHead>
              <TableHead>Skipped</TableHead>
              <TableHead>New vendors</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No uploads yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-medium text-foreground">
                  {batch.fileName}
                </TableCell>
                <TableCell>{batch.uploadedByName}</TableCell>
                <TableCell>{batch.rowCount.toLocaleString()}</TableCell>
                <TableCell>
                  {batch.skippedRowCount > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      {batch.skippedRowCount.toLocaleString()}
                    </span>
                  ) : (
                    "0"
                  )}
                </TableCell>
                <TableCell>{batch.vendorsCreated}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[batch.status]}>
                    {batch.status === "completed"
                      ? "Completed"
                      : batch.status === "failed"
                        ? "Failed"
                        : "Processing"}
                  </Badge>
                  {batch.status === "processing" && (
                    <div className="mt-1.5 w-40">
                      <Progress
                        value={
                          batch.totalRowCount > 0
                            ? Math.min(
                                100,
                                Math.round((batch.processedRowCount / batch.totalRowCount) * 100)
                              )
                            : 0
                        }
                      >
                        <ProgressValue className="text-[11px]" />
                      </Progress>
                      {batch.totalRowCount > 0 && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {batch.processedRowCount.toLocaleString()} /{" "}
                          {batch.totalRowCount.toLocaleString()} rows
                        </p>
                      )}
                    </div>
                  )}
                  {batch.status === "failed" && batch.errorMessage && (
                    <p className="mt-1 max-w-xs text-xs text-destructive">
                      {batch.errorMessage}
                    </p>
                  )}
                </TableCell>
                <TableCell>{new Date(batch.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreHorizontal />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={
                          <a
                            href={`/api/uploads/${batch.id}/download`}
                            download
                          />
                        }
                      >
                        <Download data-icon="inline-start" />
                        Download Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleting(batch)}
                      >
                        Delete all data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <DeleteBatchDialog
        batch={deleting}
        onOpenChange={() => setDeleting(null)}
        pending={isPending}
        onConfirm={(id) =>
          startTransition(() => {
            void deleteBatch(id).then(() => setDeleting(null))
          })
        }
      />
    </Card>
  )
}

function DeleteBatchDialog({
  batch,
  onOpenChange,
  onConfirm,
  pending,
}: {
  batch: BatchRow | null
  onOpenChange: () => void
  onConfirm: (id: string) => void
  pending: boolean
}) {
  return (
    <Dialog open={batch !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete all data for this upload</DialogTitle>
          <DialogDescription>
            This permanently deletes every royalty row imported from
            &ldquo;{batch?.fileName}&rdquo; ({batch?.rowCount.toLocaleString()} rows) along
            with the upload record itself. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => batch && onConfirm(batch.id)}
          >
            {pending ? "Deleting..." : "Delete all data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
