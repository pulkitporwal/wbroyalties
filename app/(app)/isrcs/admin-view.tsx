"use client"

import { useState, useTransition } from "react"
import { Check, RotateCcw, Trash2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { approveClaim, deleteIsrcClaim, rejectClaim, revertClaimToPending } from "./actions"
import type { ClaimRow } from "./vendor-view"

const statusVariant: Record<ClaimRow["status"], "secondary" | "outline" | "destructive"> = {
  approved: "secondary",
  pending: "outline",
  rejected: "destructive",
}

const ALL = "__all__"

export function AdminIsrcView({
  pendingClaims,
  allClaims,
  isSuperAdmin = false,
}: {
  pendingClaims: ClaimRow[]
  allClaims: ClaimRow[]
  isSuperAdmin?: boolean
}) {
  const [rejecting, setRejecting] = useState<ClaimRow | null>(null)
  const [deleting, setDeleting] = useState<ClaimRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<ClaimRow["status"] | "">("")
  const [search, setSearch] = useState("")

  const filteredClaims = allClaims.filter((claim) => {
    if (statusFilter && claim.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const haystack = [claim.vendorName, claim.isrc, claim.productTitle, claim.productArtistName]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  function handleApprove(claim: ClaimRow) {
    setError(null)
    startTransition(() => {
      void approveClaim(claim.id).then((res) => {
        if (res?.error) setError(res.error)
      })
    })
  }

  function handleRevert(claim: ClaimRow) {
    setError(null)
    startTransition(() => {
      void revertClaimToPending(claim.id).then((res) => {
        if (res?.error) setError(res.error)
      })
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">ISRC Claims</h1>
        <p className="text-sm text-muted-foreground">
          Review vendor-submitted ISRC ownership claims and assign them.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending review</CardTitle>
          <CardDescription>{pendingClaims.length} claim(s) awaiting a decision.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>ISRC</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingClaims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No claims waiting for review.
                  </TableCell>
                </TableRow>
              )}
              {pendingClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium text-foreground">{claim.vendorName}</TableCell>
                  <TableCell className="font-mono text-xs">{claim.isrc}</TableCell>
                  <TableCell>{claim.productTitle}</TableCell>
                  <TableCell>{claim.productArtistName}</TableCell>
                  <TableCell>{claim.labelName ?? "—"}</TableCell>
                  <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleApprove(claim)}
                      >
                        <Check data-icon="inline-start" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setRejecting(claim)}
                      >
                        <X data-icon="inline-start" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>All ISRCs</CardTitle>
            <CardDescription>
              Every claim across all vendors — pending, approved, and rejected.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select
                value={statusFilter || ALL}
                onValueChange={(value) =>
                  setStatusFilter(value === ALL ? "" : (value as ClaimRow["status"]))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Search</span>
              <Input
                placeholder="Vendor, ISRC, title, artist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">
            {filteredClaims.length} of {allClaims.length} claim(s)
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>ISRC</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewed by</TableHead>
                <TableHead>Date</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center text-muted-foreground">
                    No ISRCs match these filters.
                  </TableCell>
                </TableRow>
              )}
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium text-foreground">{claim.vendorName}</TableCell>
                  <TableCell className="font-mono text-xs">{claim.isrc}</TableCell>
                  <TableCell>{claim.productTitle}</TableCell>
                  <TableCell>{claim.productArtistName}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[claim.status]}>
                      {claim.status === "approved"
                        ? "Approved"
                        : claim.status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </Badge>
                    {claim.status === "rejected" && claim.reviewNote && (
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        {claim.reviewNote}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{claim.reviewedByName ?? "—"}</TableCell>
                  <TableCell>
                    {claim.status === "pending"
                      ? new Date(claim.createdAt).toLocaleDateString()
                      : claim.reviewedAt
                        ? new Date(claim.reviewedAt).toLocaleDateString()
                        : "—"}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {claim.status !== "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleRevert(claim)}
                          >
                            <RotateCcw data-icon="inline-start" />
                            Revert to pending
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => setDeleting(claim)}
                        >
                          <Trash2 data-icon="inline-start" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RejectClaimDialog
        claim={rejecting}
        onOpenChange={() => setRejecting(null)}
        pending={isPending}
        onConfirm={(id, note) => {
          setError(null)
          startTransition(() => {
            void rejectClaim(id, note).then((res) => {
              if (res?.error) setError(res.error)
              setRejecting(null)
            })
          })
        }}
      />

      <DeleteClaimDialog
        claim={deleting}
        onOpenChange={() => setDeleting(null)}
        pending={isPending}
        onConfirm={(id) => {
          setError(null)
          startTransition(() => {
            void deleteIsrcClaim(id).then((res) => {
              if (res?.error) setError(res.error)
              setDeleting(null)
            })
          })
        }}
      />
    </div>
  )
}

function RejectClaimDialog({
  claim,
  onOpenChange,
  onConfirm,
  pending,
}: {
  claim: ClaimRow | null
  onOpenChange: () => void
  onConfirm: (id: string, note: string) => void
  pending: boolean
}) {
  const [note, setNote] = useState("")

  return (
    <Dialog
      open={claim !== null}
      onOpenChange={(open) => {
        if (!open) setNote("")
        onOpenChange()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject claim</DialogTitle>
          <DialogDescription>
            Reject {claim?.vendorName}&rsquo;s claim on {claim?.isrc}. Optionally
            let them know why.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reject-note">Reason (optional)</Label>
          <Textarea
            id="reject-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => claim && onConfirm(claim.id, note)}
          >
            {pending ? "Rejecting..." : "Reject claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteClaimDialog({
  claim,
  onOpenChange,
  onConfirm,
  pending,
}: {
  claim: ClaimRow | null
  onOpenChange: () => void
  onConfirm: (id: string) => void
  pending: boolean
}) {
  return (
    <Dialog open={claim !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete ISRC claim</DialogTitle>
          <DialogDescription>
            This permanently deletes {claim?.vendorName}&rsquo;s claim on{" "}
            {claim?.isrc}. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => claim && onConfirm(claim.id)}
          >
            {pending ? "Deleting..." : "Delete claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
