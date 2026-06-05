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
    <aside className="hidden h-full w-64 flex-col border-r bg-white lg:flex">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 shadow-md shadow-brand-700/25">
          <Sprout className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight text-gray-900">Kosco Seeds</p>
          <p className="text-sm capitalize text-muted-foreground">{role.replace('_', ' ')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors',
                active
                  ? 'bg-brand-700 text-white shadow-md shadow-brand-700/20'
                  : 'text-gray-600 hover:bg-brand-50 hover:text-brand-800'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        {userName && (
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
              {userName.charAt(0).toUpperCase()}
            </div>
            <p className="truncate text-base font-medium text-gray-900">{userName}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
