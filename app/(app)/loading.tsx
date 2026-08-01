import { Loader } from "@/components/ui/loader"

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader size="lg" />
    </div>
  )
}
