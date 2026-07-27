"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Copy, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"

import type { BatchRow } from "./batch-history-table"

type NewVendorCredential = {
  vendorName: string
  email: string
  tempPassword: string
}

type UploadEvent =
  | { type: "total"; totalRowCount: number }
  | { type: "progress"; processedRowCount: number; failedRowCount: number; totalRowCount: number }
  | {
      type: "done"
      batchId: string
      rowCount: number
      skippedRowCount: number
      failedRowCount: number
      newVendors: NewVendorCredential[]
    }
  | { type: "error"; error: string }

type ImportProgress = {
  totalRowCount: number
  processedRowCount: number
  failedRowCount: number
}

export function UploadForm({ batches }: { batches: BatchRow[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [replaceBatchId, setReplaceBatchId] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newVendors, setNewVendors] = useState<NewVendorCredential[] | null>(null)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [skippedRowCount, setSkippedRowCount] = useState<number>(0)
  const [progress, setProgress] = useState<ImportProgress | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setRowCount(null)
    setProgress(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError("Please choose an .xlsx file to upload.")
      return
    }

    const formData = new FormData()
    formData.set("file", file)
    if (replaceBatchId) formData.set("replaceBatchId", replaceBatchId)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)

    setUploading(true)
    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      const contentType = response.headers.get("content-type") ?? ""
      if (!contentType.includes("application/x-ndjson") && !contentType.includes("application/json")) {
        const text = await response.text()
        setError(
          text.trim()
            ? `Upload failed: ${text.slice(0, 300)}`
            : `Upload failed with status ${response.status}.`
        )
        return
      }

      if (!response.body) {
        setError("Upload failed: no response from server.")
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let finished = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          const evt: UploadEvent = JSON.parse(line)

          if (evt.type === "total") {
            setProgress({ totalRowCount: evt.totalRowCount, processedRowCount: 0, failedRowCount: 0 })
          } else if (evt.type === "progress") {
            setProgress({
              totalRowCount: evt.totalRowCount,
              processedRowCount: evt.processedRowCount,
              failedRowCount: evt.failedRowCount,
            })
          } else if (evt.type === "done") {
            finished = true
            setRowCount(evt.rowCount)
            setSkippedRowCount(evt.skippedRowCount)
            setProgress({
              totalRowCount: evt.rowCount + evt.skippedRowCount,
              processedRowCount: evt.rowCount + evt.skippedRowCount,
              failedRowCount: evt.failedRowCount,
            })
            if (evt.newVendors.length > 0) {
              setNewVendors(evt.newVendors)
            }
            if (fileInputRef.current) fileInputRef.current.value = ""
            setReplaceBatchId("")
            router.refresh()
          } else if (evt.type === "error") {
            finished = true
            setError(evt.error)
          }
        }
      }

      if (!finished) {
        setError("The connection closed before the import finished. Check the upload history below.")
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "The upload timed out after 5 minutes. The file may be too large, or the connection was interrupted. Check the upload history below — it may have still completed."
        )
      } else {
        setError("Something went wrong while uploading. Please check your connection and try again.")
      }
    } finally {
      clearTimeout(timeout)
      setUploading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import a royalty report</CardTitle>
          <CardDescription>
            Upload an .xlsx export. Large files (100,000+ rows) are supported —
            processing may take a minute.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="file">Report file</Label>
              <input
                ref={fileInputRef}
                id="file"
                name="file"
                type="file"
                accept=".xlsx"
                required
                className="rounded-md border border-input bg-input/20 px-2 py-1.5 text-xs file:mr-3 file:rounded-sm file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="replace-batch">
                Replace a previous upload (optional)
              </Label>
              <Select
                value={replaceBatchId}
                onValueChange={(value) => setReplaceBatchId(value ?? "")}
              >
                <SelectTrigger id="replace-batch" className="w-full">
                  <SelectValue placeholder="Import as a new batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.fileName} — {new Date(batch.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If selected, that batch&rsquo;s rows are deleted before the new
                file is imported, so revenue isn&rsquo;t double-counted.
              </p>
            </div>

            {progress && uploading && (
              <div className="flex flex-col gap-2 rounded-md border border-input bg-input/10 p-3">
                <Progress
                  value={
                    progress.totalRowCount > 0
                      ? Math.min(
                          100,
                          Math.round((progress.processedRowCount / progress.totalRowCount) * 100)
                        )
                      : 0
                  }
                >
                  <div className="flex items-center justify-between">
                    <ProgressLabel>Importing rows...</ProgressLabel>
                    <ProgressValue />
                  </div>
                </Progress>
                <p className="text-xs text-muted-foreground">
                  {progress.processedRowCount.toLocaleString()} of{" "}
                  {progress.totalRowCount.toLocaleString()} rows processed
                  {progress.failedRowCount > 0 && (
                    <span className="text-destructive">
                      {" "}
                      &middot; {progress.failedRowCount.toLocaleString()} failed
                    </span>
                  )}
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {rowCount !== null && !error && (
              <Alert>
                <AlertDescription>
                  Imported {rowCount.toLocaleString()} rows successfully.
                  {skippedRowCount > 0 && (
                    <>
                      {" "}
                      <span className="text-destructive">
                        Failed to import {skippedRowCount.toLocaleString()} row
                        {skippedRowCount === 1 ? "" : "s"}
                      </span>{" "}
                      — either no resolvable vendor name (e.g. formula errors
                      in the source file) or a data error on that row.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={uploading}>
              <UploadCloud data-icon="inline-start" />
              {uploading ? "Importing..." : "Upload report"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <NewVendorsDialog
        vendors={newVendors}
        onOpenChange={() => setNewVendors(null)}
      />
    </>
  )
}

function NewVendorsDialog({
  vendors,
  onOpenChange,
}: {
  vendors: NewVendorCredential[] | null
  onOpenChange: () => void
}) {
  return (
    <Dialog open={vendors !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New vendor accounts created</DialogTitle>
          <DialogDescription>
            These temporary passwords are shown only once. Share them securely
            with each vendor — they&rsquo;ll be forced to set a new password on
            first sign in.
          </DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Login email</TableHead>
              <TableHead>Temp password</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors?.map((vendor) => (
              <TableRow key={vendor.vendorName}>
                <TableCell className="font-medium text-foreground">
                  {vendor.vendorName}
                </TableCell>
                <TableCell className="font-mono text-xs">{vendor.email}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${vendor.email} / ${vendor.tempPassword}`
                      )
                    }
                    className="flex items-center gap-1.5 rounded-sm bg-muted px-2 py-1 font-mono text-xs hover:bg-accent"
                    title="Copy email and password"
                  >
                    {vendor.tempPassword}
                    <Copy className="size-3" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter showCloseButton>
          <Button onClick={onOpenChange}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
