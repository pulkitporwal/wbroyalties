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

import type { BatchRow } from "./batch-history-table"

type NewVendorCredential = {
  vendorName: string
  email: string
  tempPassword: string
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError("Please choose an .xlsx file to upload.")
      return
    }

    const formData = new FormData()
    formData.set("file", file)
    if (replaceBatchId) formData.set("replaceBatchId", replaceBatchId)

    setUploading(true)
    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Import failed.")
        return
      }

      setRowCount(data.rowCount)
      setSkippedRowCount(data.skippedRowCount ?? 0)
      if (data.newVendors?.length > 0) {
        setNewVendors(data.newVendors)
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
      setReplaceBatchId("")
      router.refresh()
    } catch {
      setError("Something went wrong while uploading. Please try again.")
    } finally {
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
                      Skipped {skippedRowCount.toLocaleString()} row
                      {skippedRowCount === 1 ? "" : "s"} with no resolvable
                      vendor name (e.g. formula errors in the source file).
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
