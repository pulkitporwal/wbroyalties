"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader } from "@/components/ui/loader"
import { Info, AlertTriangle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-medium">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("h-16 w-full rounded-lg ring-1 ring-foreground/10", className)} />
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Badge variant="outline">Internal</Badge>
        <h1 className="font-heading text-3xl font-medium">Design System</h1>
        <p className="text-sm text-muted-foreground">
          A living reference of the UI primitives available in this project.
        </p>
      </header>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch name="primary" className="bg-primary" />
          <Swatch name="secondary" className="bg-secondary" />
          <Swatch name="accent" className="bg-accent" />
          <Swatch name="muted" className="bg-muted" />
          <Swatch name="destructive" className="bg-destructive" />
          <Swatch name="card" className="bg-card" />
          <Swatch name="border" className="bg-border" />
          <Swatch name="background" className="bg-background" />
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-3xl font-medium">Heading 1</h1>
          <h2 className="font-heading text-2xl font-medium">Heading 2</h2>
          <h3 className="font-heading text-xl font-medium">Heading 3</h3>
          <h4 className="font-heading text-lg font-medium">Heading 4</h4>
          <p className="text-sm">Body text — the quick brown fox jumps over the lazy dog.</p>
          <p className="text-xs text-muted-foreground">Muted small text for secondary information.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Info">
            <Info />
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </div>
      </Section>

      <Section title="Form elements">
        <div className="grid max-w-md gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Jane Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Type your message..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Select defaultValue="admin">
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Royalty Statement</CardTitle>
              <CardDescription>Q2 2026 summary</CardDescription>
              <CardAction>
                <Badge variant="secondary">Draft</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Total earnings across all active licenses for the current quarter.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                View details
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
              <CardDescription>12 contracts currently in effect</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={68} />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview" className="max-w-md">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel content.</TabsContent>
          <TabsContent value="activity">Activity panel content.</TabsContent>
          <TabsContent value="settings">Settings panel content.</TabsContent>
        </Tabs>
      </Section>

      <Section title="Accordion">
        <Accordion className="max-w-md">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is this project?</AccordionTrigger>
            <AccordionContent>
              A royalties management application built with Next.js and shadcn.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I add components?</AccordionTrigger>
            <AccordionContent>
              Run the shadcn CLI&rsquo;s add command to pull new components into components/ui.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Alerts">
        <div className="flex flex-col gap-3">
          <Alert>
            <Info />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>This is an informational alert.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>This is a destructive alert.</AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Dialog, Dropdown & Tooltip">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Are you sure you want to continue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button variant="destructive">Continue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  Menu <ChevronDown data-icon="inline-end" />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
            <TooltipContent>A helpful tooltip</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      <Section title="Avatars">
        <div className="flex items-center gap-6">
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>CD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>EF</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        </div>
      </Section>

      <Section title="Progress & Slider">
        <div className="flex max-w-md flex-col gap-6">
          <Progress value={42} />
          <Slider defaultValue={[30]} />
        </div>
      </Section>

      <Section title="Loader">
        <div className="flex flex-wrap items-end gap-8">
          <Loader size="sm" />
          <Loader />
          <Loader size="lg" />
        </div>
      </Section>

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Licensee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Acme Corp</TableCell>
              <TableCell>
                <Badge variant="secondary">Paid</Badge>
              </TableCell>
              <TableCell>$4,200.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Globex Inc</TableCell>
              <TableCell>
                <Badge variant="outline">Pending</Badge>
              </TableCell>
              <TableCell>$1,850.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Separator />

      <footer className="pb-8 text-xs text-muted-foreground">
        Built with shadcn/ui on Next.js.
      </footer>
    </div>
  )
}
