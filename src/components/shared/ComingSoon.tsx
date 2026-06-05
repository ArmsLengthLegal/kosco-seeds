import { Card, CardContent } from '@/components/ui/card'
import { Hammer } from 'lucide-react'

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <Card><CardContent className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <Hammer className="h-8 w-8 text-amber-500" />
        </div>
        <p className="text-lg font-medium text-gray-700">Coming soon</p>
        {description && <p className="mt-1 text-base text-muted-foreground">{description}</p>}
      </CardContent></Card>
    </div>
  )
}
