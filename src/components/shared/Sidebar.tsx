'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, MapPin, FileText, ClipboardCheck,
  BarChart3, Settings, LogOut, Sprout
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin','admin','manager','inspector','viewer'] },
  { href: '/farmers', label: 'Farmers', icon: Users, roles: ['super_admin','admin','manager','viewer'] },
  { href: '/fields', label: 'Fields', icon: MapPin, roles: ['super_admin','admin','manager'] },
  { href: '/agreements', label: 'Agreements', icon: FileText, roles: ['super_admin','admin','manager'] },
  { href: '/inspections', label: 'Inspections', icon: ClipboardCheck, roles: ['super_admin','admin','manager','inspector'] },
  { href: '/reports/executive', label: 'Reports', icon: BarChart3, roles: ['super_admin','admin','manager','viewer'] },
  { href: '/settings/users', label: 'Settings', icon: Settings, roles: ['super_admin','admin'] },
]

interface SidebarProps {
  role: string
  userName: string
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r bg-white">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800">
          <Sprout className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Kosco Seeds</p>
          <p className="text-xs text-gray-400 capitalize">{role.replace('_', ' ')}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href) && href !== '/dashboard'
                ? 'bg-green-50 text-green-800'
                : pathname === href
                ? 'bg-green-50 text-green-800'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 px-2">
          <p className="text-xs font-medium text-gray-900 truncate">{userName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
