import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, MapPin, ClipboardCheck, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const btnBase = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 px-3 py-1.5'
const btnPrimary = cn(btnBase, 'bg-green-800 text-white hover:bg-green-900')
const btnOutline = cn(btnBase, 'border border-input bg-background hover:bg-accent hover:text-accent-foreground')

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user!.id)
    .single()

  const role = profile?.role ?? 'viewer'
  const isInspector = role === 'inspector'

  const [farmersRes, assignmentsRes] = await Promise.all([
    supabase.from('farmers').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('inspection_assignments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  if (isInspector) {
    const { data: myTasks } = await supabase
      .from('inspection_assignments')
      .select(`
        id, scheduled_date, status, notes_for_inspector, inspection_number, inspection_type,
        production_agreements(
          crop_year, crop_season,
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
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Good morning, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <Badge variant="outline" className="text-green-700 border-green-700">
            {myTasks?.length ?? 0} tasks today
          </Badge>
        </div>

        {myTasks?.length === 0 && (
          <Card><CardContent className="py-8 text-center text-gray-500">
            <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No pending inspections assigned to you.</p>
          </CardContent></Card>
        )}

        {myTasks?.map((task) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const agr = task.production_agreements as any
          const farmer = agr?.farmers as Record<string, unknown>
          const field = agr?.farmer_fields as Record<string, unknown>
          const crop = agr?.crop_varieties as Record<string, unknown>
          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{String(farmer?.full_name ?? '')}</p>
                    <p className="text-sm text-gray-500">{String(farmer?.village ?? '')} · {String(crop?.crop_name ?? '')} {String(crop?.variety_code ?? '')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Inspection #{task.inspection_number}
                      {task.inspection_type === 'additional' && (
                        <Badge className="ml-2 text-xs bg-amber-100 text-amber-800">Additional</Badge>
                      )}
                    </p>
                    {task.notes_for_inspector && (
                      <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1">{task.notes_for_inspector}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={task.status === 'in-progress' ? 'default' : 'secondary'}>{task.status}</Badge>
                    <p className="text-xs text-gray-400">{task.scheduled_date}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`https://maps.google.com/?q=${field?.centroid_lat},${field?.centroid_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(btnOutline, 'flex-1 gap-1')}
                  >
                    <MapPin className="h-3 w-3" /> Navigate
                  </a>
                  <Link href={`/inspections/${task.id}`} className={cn(btnPrimary, 'flex-1')}>
                    Start Inspection
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/farmers/new" className={btnPrimary}>+ Add Farmer</Link>
          <Link href="/inspections/assign" className={btnOutline}>Assign Inspection</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { title: 'Farmers', icon: Users, value: farmersRes.count ?? 0, sub: 'Under agreement', color: 'text-gray-900' },
          { title: 'Pending', icon: Clock, value: assignmentsRes.count ?? 0, sub: 'Inspections pending', color: 'text-amber-600' },
          { title: 'Completed', icon: ClipboardCheck, value: '—', sub: 'This season', color: 'text-green-700' },
          { title: 'Expected Yield', icon: TrendingUp, value: '—', sub: 'Quintals (est.)', color: 'text-gray-900' },
        ].map(({ title, icon: Icon, value, sub, color }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Icon className="h-4 w-4" /> {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${color}`}>{String(value)}</p>
              <p className="text-xs text-gray-500 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add Farmer', href: '/farmers/new', icon: Users },
              { label: 'All Farmers', href: '/farmers', icon: Users },
              { label: 'Assign Inspection', href: '/inspections/assign', icon: ClipboardCheck },
              { label: 'Reports', href: '/reports/executive', icon: TrendingUp },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className={cn(btnOutline, 'justify-start gap-2 h-10')}>
                <Icon className="h-4 w-4 text-green-700" />
                <span className="text-sm">{label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-gray-500">No alerts at this time.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
