'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Check } from 'lucide-react'

const schema = z.object({
  farmer_id: z.string().uuid('Select a farmer'),
  field_id: z.string().optional(),
  crop_variety_id: z.string().uuid('Select a crop variety'),
  seed_quality_id: z.string().uuid('Select seed quality'),
  crop_season: z.enum(['kharif', 'rabi', 'zaid']),
  crop_year: z.string().min(4, 'Select year'),
  sowing_date: z.string().optional(),
  area_acres: z.string().min(1, 'Enter area'),
  seed_quantity_kg: z.string().min(1, 'Enter seed quantity'),
  expected_yield_quintals: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const inputCls = 'h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10'
const selectCls = inputCls

function NewAgreementForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedFarmer = searchParams.get('farmer')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [farmers, setFarmers] = useState<Array<{ id: string; full_name: string; farmer_code: string }>>([])
  const [fields, setFields] = useState<Array<{ id: string; field_name: string; khasra_number: string; total_area_acres: number }>>([])
  const [varieties, setVarieties] = useState<Array<{ id: string; crop_name: string; variety_code: string; crop_season: string }>>([])
  const [qualities, setQualities] = useState<Array<{ id: string; quality_name: string }>>([])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      farmer_id: preselectedFarmer || '',
      crop_season: 'kharif',
      crop_year: String(new Date().getFullYear()),
    },
  })

  const watchFarmer = watch('farmer_id')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: f }, { data: v }, { data: q }] = await Promise.all([
        supabase.from('farmers').select('id, full_name, farmer_code').eq('is_deleted', false).order('full_name').limit(200),
        supabase.from('crop_varieties').select('id, crop_name, variety_code, crop_season').eq('is_active', true).order('crop_name'),
        supabase.from('seed_qualities').select('id, quality_name').eq('is_active', true).order('sort_order'),
      ])
      setFarmers(f ?? [])
      setVarieties(v ?? [])
      setQualities(q ?? [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!watchFarmer) return
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('farmer_fields').select('id, field_name, khasra_number, total_area_acres').eq('farmer_id', watchFarmer).eq('is_deleted', false)
      setFields(data ?? [])
    }
    load()
  }, [watchFarmer])

  const generateAgreementNumber = async (supabase: ReturnType<typeof createClient>, season: string, year: number) => {
    const { count } = await supabase.from('production_agreements').select('*', { count: 'exact', head: true })
    const seasonCode = season === 'kharif' ? 'KH' : season === 'rabi' ? 'RB' : 'ZD'
    return `CS-${year}-${seasonCode}-${String((count ?? 0) + 1).padStart(3, '0')}`
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const agrNumber = await generateAgreementNumber(supabase, data.crop_season, parseInt(data.crop_year))

    const { error: err } = await supabase.from('production_agreements').insert({
      ...data,
      crop_year: parseInt(data.crop_year),
      area_acres: parseFloat(data.area_acres),
      seed_quantity_kg: parseFloat(data.seed_quantity_kg),
      expected_yield_quintals: data.expected_yield_quintals ? parseFloat(data.expected_yield_quintals) : null,
      agreement_number: agrNumber,
      status: 'active',
      created_by: user?.id,
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    router.push(`/farmers/${data.farmer_id}`)
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Agreement</h1>
          <p className="text-base text-muted-foreground">Production agreement details</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Farmer *</label>
          <select {...register('farmer_id')} className={selectCls}>
            <option value="">Select farmer</option>
            {farmers.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_code})</option>)}
          </select>
          {errors.farmer_id && <p className="text-base text-destructive">{errors.farmer_id.message}</p>}
        </div>

        {fields.length > 0 && (
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Field</label>
            <select {...register('field_id')} className={selectCls}>
              <option value="">Select field (optional)</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.field_name || f.khasra_number} — {f.total_area_acres} acres</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Crop Variety *</label>
          <select {...register('crop_variety_id')} className={selectCls}>
            <option value="">Select crop variety</option>
            {varieties.map(v => <option key={v.id} value={v.id}>{v.crop_name} — {v.variety_code} ({v.crop_season})</option>)}
          </select>
          {errors.crop_variety_id && <p className="text-base text-destructive">{errors.crop_variety_id.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Seed Quality *</label>
          <select {...register('seed_quality_id')} className={selectCls}>
            <option value="">Select quality</option>
            {qualities.map(q => <option key={q.id} value={q.id}>{q.quality_name}</option>)}
          </select>
          {errors.seed_quality_id && <p className="text-base text-destructive">{errors.seed_quality_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Season *</label>
            <select {...register('crop_season')} className={selectCls}>
              <option value="kharif">Kharif (खरीफ)</option>
              <option value="rabi">Rabi (रबी)</option>
              <option value="zaid">Zaid</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Year *</label>
            <select {...register('crop_year')} className={selectCls}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Sowing Date</label>
          <input {...register('sowing_date')} type="date" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Area (acres) *</label>
            <input {...register('area_acres')} type="number" step="0.001" placeholder="Acres" className={inputCls} />
            {errors.area_acres && <p className="text-base text-destructive">{errors.area_acres.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Seed Qty (kg) *</label>
            <input {...register('seed_quantity_kg')} type="number" step="0.1" placeholder="Kg allotted" className={inputCls} />
            {errors.seed_quantity_kg && <p className="text-base text-destructive">{errors.seed_quantity_kg.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Expected Yield (quintals)</label>
          <input {...register('expected_yield_quintals')} type="number" step="0.1" placeholder="Estimated quintals" className={inputCls} />
        </div>

        <button type="submit" disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60">
          {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> Create Agreement</>}
        </button>
      </form>
    </div>
  )
}

export default function NewAgreementPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-700" /></div>}><NewAgreementForm /></Suspense>
}
