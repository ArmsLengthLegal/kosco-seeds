import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/shared/Sidebar'
import MobileNav from '@/components/shared/MobileNav'
import SyncBadge from '@/components/shared/SyncBadge'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role={profile?.role ?? 'viewer'} userName={profile?.full_name ?? ''} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <MobileNav role={profile?.role ?? 'viewer'} />
            <span className="font-semibold text-green-800">Kosco Seeds</span>
          </div>
          <div className="hidden lg:block" />
          <SyncBadge />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
