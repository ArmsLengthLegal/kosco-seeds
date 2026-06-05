'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Check } from 'lucide-react'

const schema = z.object({
  production_agreement_id: z.string().uuid('Select an agreement'),
  inspection_type: z.enum(['standard_1', 'standard_2', 'additional']),
  assigned_inspector_id: z.string().uuid('Select an inspector'),
  scheduled_date: z.string().min(1, 'Select a date'),
  notes_for_inspector: z.string().optional(),
  additional_reason: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const inputCls = 'h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10'
const selectCls = inputCls

function AssignForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preAgreement = searchParams.get('agreement')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreements, setAgreements] = useState<Array<{ id: string; agreement_number: string; farmers: { full_name: string }; crop_varieties: { crop_name: string; variety_code: string } }>>([])
  const [inspectors, setInspectors] = useState<Array<{ id: string; full_name: string; zone_area: string }>>([])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { production_agreement_id: preAgreement || '', inspection_type: 'standard_1' },
  })

  const watchType = watch('inspection_type')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: a }, { data: i }] = await Promise.all([
        supabase.from('production_agreements').select(`id, agreement_number, farmers(full_name), crop_varieties(crop_name, variety_code)`).eq('status', 'active').order('created_at', { ascending: false }).limit(100),
        supabase.from('users').select('id, full_name, zone_area').eq('role', 'inspector').eq('is_active', true).order('full_name'),
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAgreements((a ?? []) as any)
      setInspectors(i ?? [])
    }
    load()
  }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const inspNum = data.inspection_type === 'standard_1' ? 1 : data.inspection_type === 'standard_2' ? 2 : 3

    const { error: err } = await supabase.from('inspection_assignments').insert({
      ...data,
      inspection_number: inspNum,
      assigned_by: user?.id,
      status: 'pending',
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push('/inspections')
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assign Inspection</h1>
          <p className="text-base text-muted-foreground">Send inspector to the field</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Agreement *</label>
          <select {...register('production_agreement_id')} className={selectCls}>
            <option value="">Select agreement</option>
            {agreements.map(a => (
              <option key={a.id} value={a.id}>
                {a.agreement_number} — {a.farmers?.full_name} · {a.crop_varieties?.crop_name}
              </option>
            ))}
          </select>
          {errors.production_agreement_id && <p className="text-base text-destructive">{errors.production_agreement_id.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Inspection Type *</label>
          <div className="space-y-2">
            {[
              { value: 'standard_1', label: '1st Standard Visit', desc: 'First scheduled inspection' },
              { value: 'standard_2', label: '2nd Standard Visit', desc: 'Second scheduled inspection' },
              { value: 'additional', label: 'Additional (Complaint)', desc: 'Extra visit — needs reason below' },
            ].map(opt => (
              <label key={opt.value} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${watchType === opt.value ? 'border-brand-700 bg-brand-50' : 'border-input bg-white hover:border-gray-300'}`}>
                <input {...register('inspection_type')} type="radio" value={opt.value} className="h-5 w-5 accent-brand-700" />
                <div>
                  <p className="text-base font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {watchType === 'additional' && (
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Reason for Additional Inspection *</label>
            <select {...register('additional_reason')} className={selectCls}>
              <option value="">Select reason</option>
              <option value="complaint">Complaint received</option>
              <option value="rogue-plants">High rogue plant %</option>
              <option value="isolation-breach">Isolation breach suspected</option>
              <option value="recheck">Re-check required</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Inspector *</label>
          <select {...register('assigned_inspector_id')} className={selectCls}>
            <option value="">Select inspector</option>
            {inspectors.length === 0 && <option disabled>No inspectors found — add users in Settings</option>}
            {inspectors.map(i => <option key={i.id} value={i.id}>{i.full_name}{i.zone_area ? ` (${i.zone_area})` : ''}</option>)}
          </select>
          {errors.assigned_inspector_id && <p className="text-base text-destructive">{errors.assigned_inspector_id.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Scheduled Date *</label>
          <input {...register('scheduled_date')} type="date" min={new Date().toISOString().split('T')[0]} className={inputCls} />
          {errors.scheduled_date && <p className="text-base text-destructive">{errors.scheduled_date.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Notes for Inspector</label>
          <textarea {...register('notes_for_inspector')} rows={3} placeholder="Any special instructions for the inspector…"
            className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10" />
        </div>

        <button type="submit" disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60">
          {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> Assign Inspection</>}
        </button>
      </form>
    </div>
  )
}

export default function AssignInspectionPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-700" /></div>}><AssignForm /></Suspense>
}
