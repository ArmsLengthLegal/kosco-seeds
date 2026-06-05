import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, MapPin, ClipboardCheck, TrendingUp, Clock, Navigation, Plus, FileText, Sprout } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user!.id)
    .single()

  const role = profile?.role ?? 'viewer'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const isInspector = role === 'inspector'

  const [farmersRes, assignmentsRes] = await Promise.all([
    supabase.from('farmers').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('inspection_assignments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  // ---------------- INSPECTOR VIEW ----------------
  if (isInspector) {
    const { data: myTasks } = await supabase
      .from('inspection_assignments')
      .select(`
        id, scheduled_date, status, notes_for_inspector, inspection_number, inspection_type,
        production_agreements(
          farmers(full_name, village, primary_phone),
          farmer_fields(field_name, centroid_lat, centroid_lng),
          crop_varieties(crop_name, variety_code)
        )
      `)
      .eq('assigned_inspector_id', user!.id)
      .in('status', ['pending', 'in-progress'])
      .order('scheduled_date', { ascending: true })
      .limit(20)

    return (
      <div className="mx-auto max-w-2xl space-y-5 pb-24">
        <div>
          <p className="text-lg text-muted-foreground">Namaste 🙏</p>
          <h1 className="text-3xl font-bold text-gray-900">{firstName}</h1>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-brand-700 p-5 text-white shadow-lg shadow-brand-700/25">
          <ClipboardCheck className="h-10 w-10 shrink-0" />
          <div>
            <p className="text-3xl font-bold leading-none">{myTasks?.length ?? 0}</p>
            <p className="text-lg">Inspections to do today</p>
          </div>
        </div>

        {myTasks?.length === 0 && (
          <Card><CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
              <Sprout className="h-8 w-8 text-brand-600" />
            </div>
            <p className="text-lg text-gray-600">No inspections assigned right now.</p>
            <p className="text-base text-muted-foreground">Enjoy your day!</p>
          </CardContent></Card>
        )}

        {myTasks?.map((task) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const agr = task.production_agreements as any
          const farmer = agr?.farmers
          const field = agr?.farmer_fields
          const crop = agr?.crop_varieties
          return (
            <Card key={task.id} className="overflow-hidden border-2">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-bold text-gray-900">{farmer?.full_name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-lg text-muted-foreground">
                        <MapPin className="h-5 w-5 shrink-0" /> {farmer?.village}
                      </p>
                      <p className="mt-1 text-base text-gray-700">
                        🌾 {crop?.crop_name} {crop?.variety_code}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-block rounded-full px-3 py-1 text-base font-semibold ${
                        task.inspection_type === 'additional'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-brand-50 text-brand-700'
                      }`}>
                        {task.inspection_type === 'additional' ? 'Extra' : `Visit ${task.inspection_number}`}
                      </span>
                    </div>
                  </div>

                  {task.notes_for_inspector && (
                    <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-900">
                      📝 {task.notes_for_inspector}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-px bg-border">
                  <a
                    href={`https://maps.google.com/?q=${field?.centroid_lat},${field?.centroid_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-16 items-center justify-center gap-2 bg-white text-lg font-semibold text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
                  >
                    <Navigation className="h-6 w-6 text-brand-600" /> Navigate
                  </a>
                  <Link
                    href={`/inspections/${task.id}`}
                    className="flex h-16 items-center justify-center gap-2 bg-brand-700 text-lg font-semibold text-white transition hover:bg-brand-800 active:bg-brand-900"
                  >
                    <ClipboardCheck className="h-6 w-6" /> Start
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // ---------------- ADMIN / MANAGER VIEW ----------------
  const stats = [
    { title: 'Farmers', icon: Users, value: farmersRes.count ?? 0, sub: 'Under agreement', bg: 'bg-brand-50', fg: 'text-brand-700' },
    { title: 'Pending', icon: Clock, value: assignmentsRes.count ?? 0, sub: 'Inspections', bg: 'bg-amber-50', fg: 'text-amber-600' },
    { title: 'Completed', icon: ClipboardCheck, value: '—', sub: 'This season', bg: 'bg-green-50', fg: 'text-green-700' },
    { title: 'Exp. Yield', icon: TrendingUp, value: '—', sub: 'Quintals', bg: 'bg-blue-50', fg: 'text-blue-700' },
  ]

  const quickActions = [
    { label: 'Add Farmer', href: '/farmers/new', icon: Plus, primary: true },
    { label: 'All Farmers', href: '/farmers', icon: Users },
    { label: 'Assign Inspection', href: '/inspections/assign', icon: ClipboardCheck },
    { label: 'Reports', href: '/reports/executive', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg text-muted-foreground">Welcome back,</p>
        <h1 className="text-3xl font-bold text-gray-900">{firstName} 👋</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ title, icon: Icon, value, sub, bg, fg }) => (
          <Card key={title} className="border-2">
            <CardContent className="p-5">
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`h-6 w-6 ${fg}`} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{String(value)}</p>
              <p className="text-base font-medium text-gray-500">{title}</p>
              <p className="text-sm text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ label, href, icon: Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 text-center transition active:scale-[0.98] ${
                primary
                  ? 'border-brand-700 bg-brand-700 text-white shadow-lg shadow-brand-700/25 hover:bg-brand-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50'
              }`}
            >
              <Icon className={`h-8 w-8 ${primary ? 'text-white' : 'text-brand-600'}`} />
              <span className="px-2 text-base font-semibold leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
