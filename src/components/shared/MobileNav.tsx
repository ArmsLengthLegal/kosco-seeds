'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function MobileNav({ role }: { role: string }) {
  return (
    <Sheet>
      <SheetTrigger>
        <button className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-60">
        <Sidebar role={role} userName="" />
      </SheetContent>
    </Sheet>
  )
}
