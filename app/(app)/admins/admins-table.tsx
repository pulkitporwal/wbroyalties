"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { AlertCircle, MoreHorizontal, Plus } from "lucide-react"

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
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  setAdminStatus,
  deleteAdmin,
} from "./actions"

export type AdminRow = {
  id: string
  name: string
  email: string
  status: "active" | "suspended"
  createdAt: string
}

export function AdminsTable({ admins }: { admins: AdminRow[] }) {
  const [editing, setEditing] = useState<AdminRow | null>(null)
  const [resetting, setResetting] = useState<AdminRow | null>(null)
  const [deleting, setDeleting] = useState<AdminRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          Add admin
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No admins yet.
              </TableCell>
            </TableRow>
          )}
          {admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell className="font-medium text-foreground">
                {admin.name}
              </TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>
                <Badge variant={admin.status === "active" ? "secondary" : "outline"}>
                  {admin.status === "active" ? "Active" : "Suspended"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(admin.createdAt).toLocaleDateString()}
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
                    <DropdownMenuItem onClick={() => setEditing(admin)}>
                      Edit profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setResetting(admin)}>
                      Reset password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => {
                          void setAdminStatus(
                            admin.id,
                            admin.status === "active" ? "suspended" : "active"
                          )
                        })
                      }
                    >
                      {admin.status === "active" ? "Suspend" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(admin)}
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

      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditAdminDialog admin={editing} onOpenChange={() => setEditing(null)} />
      <ResetPasswordDialog admin={resetting} onOpenChange={() => setResetting(null)} />
      <DeleteAdminDialog
        admin={deleting}
        onOpenChange={() => setDeleting(null)}
        pending={isPending}
        onConfirm={(id) =>
          startTransition(() => {
            void deleteAdmin(id).then(() => setDeleting(null))
          })
        }
      />
    </div>
  )
}

function CreateAdminDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [state, formAction, pending] = useActionState(createAdmin, undefined)

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add admin</DialogTitle>
          <DialogDescription>
            Create a new admin account. They&rsquo;ll sign in with this email and
            password.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name">Name</Label>
            <Input id="create-name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-email">Email</Label>
            <Input id="create-email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              name="password"
              type="password"
              required
              minLength={8}
            />
          </div>
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditAdminDialog({
  admin,
  onOpenChange,
}: {
  admin: AdminRow | null
  onOpenChange: () => void
}) {
  const [state, formAction, pending] = useActionState(updateAdmin, undefined)

  useEffect(() => {
    if (state?.success) {
      onOpenChange()
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit admin</DialogTitle>
          <DialogDescription>Update this admin&rsquo;s profile info.</DialogDescription>
        </DialogHeader>
        {admin && (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={admin.id} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" name="name" defaultValue={admin.name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={admin.email}
                required
              />
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
  admin,
  onOpenChange,
}: {
  admin: AdminRow | null
  onOpenChange: () => void
}) {
  const [state, formAction, pending] = useActionState(resetAdminPassword, undefined)

  useEffect(() => {
    if (state?.success) {
      onOpenChange()
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {admin?.name}. They&rsquo;ll need to use it on their
            next sign in.
          </DialogDescription>
        </DialogHeader>
        {admin && (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={admin.id} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-password">New password</Label>
              <Input
                id="reset-password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </div>
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Reset password"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteAdminDialog({
  admin,
  onOpenChange,
  onConfirm,
  pending,
}: {
  admin: AdminRow | null
  onOpenChange: () => void
  onConfirm: (id: string) => void
  pending: boolean
}) {
  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete admin</DialogTitle>
          <DialogDescription>
            This permanently deletes {admin?.name}&rsquo;s account. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => admin && onConfirm(admin.id)}
          >
            {pending ? "Deleting..." : "Delete admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
