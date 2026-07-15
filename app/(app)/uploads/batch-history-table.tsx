"use client"

import { Badge } from "@/components/ui/badge"
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

export type BatchRow = {
  id: string
  fileName: string
  uploadedByName: string
  rowCount: number
  skippedRowCount: number
  vendorsCreated: number
  status: "processing" | "completed" | "failed"
  errorMessage?: string | null
  createdAt: string
}

const statusVariant: Record<BatchRow["status"], "secondary" | "outline" | "destructive"> = {
  completed: "secondary",
  processing: "outline",
  failed: "destructive",
}

export function BatchHistoryTable({ batches }: { batches: BatchRow[] }) {
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No uploads yet.
                </TableCell>
              </TableRow>
            )}
            {batches.map((batch) => (
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
                  {batch.status === "failed" && batch.errorMessage && (
                    <p className="mt-1 max-w-xs text-xs text-destructive">
                      {batch.errorMessage}
                    </p>
                  )}
                </TableCell>
                <TableCell>{new Date(batch.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
