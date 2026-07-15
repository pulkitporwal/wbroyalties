"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { AlertCircle, Copy, MoreHorizontal, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  createVendor,
  updateVendor,
  resetVendorPassword,
  setVendorStatus,
  deleteVendor,
} from "./actions"

export type VendorRow = {
  id: string
  name: string
  vendorName: string
  email: string
  status: "active" | "suspended"
  ottCommissionPercent: number
  ytCommissionPercent: number
  mustChangePassword: boolean
  createdAt: string
}

export function VendorsTable({ vendors }: { vendors: VendorRow[] }) {
  const [editing, setEditing] = useState<VendorRow | null>(null)
  const [resetting, setResetting] = useState<VendorRow | null>(null)
  const [deleting, setDeleting] = useState<VendorRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          Add vendor
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Login email</TableHead>
            <TableHead>OTT %</TableHead>
            <TableHead>YT %</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No vendors yet. They&rsquo;ll appear here once a report is
                uploaded, or you can add one manually.
              </TableCell>
            </TableRow>
          )}
          {vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell className="font-medium text-foreground">
                {vendor.vendorName}
                {vendor.mustChangePassword && (
                  <Badge variant="outline" className="ml-2">
                    Temp password
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">{vendor.email}</TableCell>
              <TableCell>{vendor.ottCommissionPercent}%</TableCell>
              <TableCell>{vendor.ytCommissionPercent}%</TableCell>
              <TableCell>
                <Badge variant={vendor.status === "active" ? "secondary" : "outline"}>
                  {vendor.status === "active" ? "Active" : "Suspended"}
                </Badge>
              </TableCell>
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
                    <DropdownMenuItem onClick={() => setEditing(vendor)}>
                      Edit details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setResetting(vendor)}>
                      Reset password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => {
                          void setVendorStatus(
                            vendor.id,
                            vendor.status === "active" ? "suspended" : "active"
                          )
                        })
                      }
                    >
                      {vendor.status === "active" ? "Suspend" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(vendor)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateVendorDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditVendorDialog vendor={editing} onOpenChange={() => setEditing(null)} />
      <ResetPasswordDialog vendor={resetting} onOpenChange={() => setResetting(null)} />
      <DeleteVendorDialog
        vendor={deleting}
        onOpenChange={() => setDeleting(null)}
        pending={isPending}
        onConfirm={(id) =>
          startTransition(() => {
            void deleteVendor(id).then(() => setDeleting(null))
          })
        }
      />
    </div>
  )
}

function CreateVendorDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [state, formAction, pending] = useActionState(createVendor, undefined)

  useEffect(() => {
    if (state?.success && !state.tempPassword) {
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add vendor</DialogTitle>
          <DialogDescription>
            Manually provision a vendor account before any report mentions
            them. The name must exactly match the &ldquo;Vendor name&rdquo;
            column used in future uploads.
          </DialogDescription>
        </DialogHeader>
        {state?.success && state.tempPassword ? (
          <div className="flex flex-col gap-3">
            <Alert>
              <AlertDescription>
                Vendor created. This temporary password is shown only once —
                share it securely.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {state.tempPassword}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(state.tempPassword ?? "")}
                aria-label="Copy password"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-vendor-name">Vendor name</Label>
              <Input id="create-vendor-name" name="vendorName" required />
            </div>
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating..." : "Create vendor"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditVendorDialog({
  vendor,
  onOpenChange,
}: {
  vendor: VendorRow | null
  onOpenChange: () => void
}) {
  const [state, formAction, pending] = useActionState(updateVendor, undefined)

  useEffect(() => {
    if (state?.success) {
      onOpenChange()
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={vendor !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit vendor</DialogTitle>
          <DialogDescription>
            Update {vendor?.vendorName}&rsquo;s login email and commission
            percentages.
          </DialogDescription>
        </DialogHeader>
        {vendor && (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={vendor.id} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Display name</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={vendor.name}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Login email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={vendor.email}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-ott">OTT commission %</Label>
                <Input
                  id="edit-ott"
                  name="ottCommissionPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={vendor.ottCommissionPercent}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-yt">YouTube commission %</Label>
                <Input
                  id="edit-yt"
                  name="ytCommissionPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={vendor.ytCommissionPercent}
                  required
                />
              </div>
            </div>
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({
  vendor,
  onOpenChange,
}: {
  vendor: VendorRow | null
  onOpenChange: () => void
}) {
  const [state, formAction, pending] = useActionState(resetVendorPassword, undefined)

  return (
    <Dialog open={vendor !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Generates a new temporary password for {vendor?.vendorName}. They&rsquo;ll
            be required to set their own password on next sign in.
          </DialogDescription>
        </DialogHeader>
        {state?.success && state.tempPassword ? (
          <div className="flex flex-col gap-3">
            <Alert>
              <AlertDescription>
                This password is shown only once — share it securely.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {state.tempPassword}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(state.tempPassword ?? "")}
                aria-label="Copy password"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <DialogFooter>
              <Button onClick={onOpenChange}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          vendor && (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={vendor.id} />
              {state?.error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Generating..." : "Generate new password"}
                </Button>
              </DialogFooter>
            </form>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteVendorDialog({
  vendor,
  onOpenChange,
  onConfirm,
  pending,
}: {
  vendor: VendorRow | null
  onOpenChange: () => void
  onConfirm: (id: string) => void
  pending: boolean
}) {
  return (
    <Dialog open={vendor !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete vendor</DialogTitle>
          <DialogDescription>
            This permanently deletes {vendor?.vendorName}&rsquo;s account. Their
            imported royalty rows are kept, but attribution to a live account
            is removed. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => vendor && onConfirm(vendor.id)}
          >
            {pending ? "Deleting..." : "Delete vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
