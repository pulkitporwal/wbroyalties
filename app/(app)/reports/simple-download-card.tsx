"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

export function SimpleDownloadCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button render={<a href={href} download />}>
          <Download data-icon="inline-start" />
          Download
        </Button>
      </CardFooter>
    </Card>
  )
}
