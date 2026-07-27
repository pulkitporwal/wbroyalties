"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import { AlertCircle, Disc3, Plus } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { submitIsrcClaim } from "./actions"

export type ClaimRow = {
  id: string
  vendorId: string
  vendorName: string
  isrc: string
  productTitle: string
  productArtistName: string
  productAlbumName: string | null
  labelName: string | null
  notes: string | null
  status: "pending" | "approved" | "rejected"
  reviewedByName: string | null
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
}

const statusVariant: Record<ClaimRow["status"], "secondary" | "outline" | "destructive"> = {
  approved: "secondary",
  pending: "outline",
  rejected: "destructive",
}

export function VendorIsrcView({
  vendorName,
  claims,
}: {
  vendorName: string
  claims: ClaimRow[]
}) {
  const [claimOpen, setClaimOpen] = useState(false)
  const approved = claims.filter((c) => c.status === "approved")

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">My ISRCs</h1>
          <p className="text-sm text-muted-foreground">
            ISRCs assigned to {vendorName}, and your outstanding claim requests.
          </p>
        </div>
        <Button onClick={() => setClaimOpen(true)}>
          <Plus data-icon="inline-start" />
          Claim an ISRC
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned to you</CardTitle>
          <CardDescription>ISRCs currently approved as yours.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ISRC</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Album</TableHead>
                <TableHead>Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approved.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No ISRCs assigned yet. Submit a claim to get started.
                  </TableCell>
                </TableRow>
              )}
              {approved.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-mono text-xs">{claim.isrc}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {claim.productTitle}
                  </TableCell>
                  <TableCell>{claim.productArtistName}</TableCell>
                  <TableCell>{claim.productAlbumName ?? "—"}</TableCell>
                  <TableCell>
                    {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claim requests</CardTitle>
          <CardDescription>Status of every ISRC you&rsquo;ve claimed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ISRC</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    You haven&rsquo;t submitted any ISRC claims yet.
                  </TableCell>
                </TableRow>
              )}
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-mono text-xs">{claim.isrc}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {claim.productTitle}
                  </TableCell>
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
                      <p className="mt-1 max-w-xs text-xs text-destructive">
                        {claim.reviewNote}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClaimIsrcDialog open={claimOpen} onOpenChange={setClaimOpen} />
    </div>
  )
}

function ClaimIsrcDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [state, formAction, pending] = useActionState(submitIsrcClaim, undefined)

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Disc3 data-icon="inline-start" />
            Claim an ISRC
          </DialogTitle>
          <DialogDescription>
            Submit the details for a recording you own. An admin will review
            and approve the claim before it&rsquo;s assigned to you.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-isrc">ISRC</Label>
            <Input id="claim-isrc" name="isrc" placeholder="e.g. USABC1234567" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-title">Title</Label>
            <Input id="claim-title" name="productTitle" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="claim-artist">Artist</Label>
              <Input id="claim-artist" name="productArtistName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="claim-album">Album</Label>
              <Input id="claim-album" name="productAlbumName" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-label">Label</Label>
            <Input id="claim-label" name="labelName" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-notes">Notes (optional)</Label>
            <Textarea id="claim-notes" name="notes" rows={3} />
          </div>
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting..." : "Submit claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
