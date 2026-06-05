'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Check } from 'lucide-react'

const schema = z.object({
  field_name: z.string().optional(),
  khasra_number: z.string().min(1, 'Khasra number is required'),
  khata_number: z.string().optional(),
  village: z.string().min(1, 'Village is required'),
  tehsil: z.string().optional(),
  total_area_acres: z.string().min(1, 'Enter area in acres'),
  area_under_seed_acres: z.string().min(1, 'Enter seed area'),
  soil_type: z.string().optional(),
  irrigation_source: z.string().optional(),
  irrigation_availability: z.string().optional(),
  govt_registration_number: z.string().optional(),
  is_primary_field: z.boolean().optional(),
})

type FieldForm = z.infer<typeof schema>

const inputCls = 'h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10'
const selectCls = inputCls

export default function AddFieldPage() {
  const params = useParams()
  const farmerId = params.id as string
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FieldForm>({
    resolver: zodResolver(schema),
    defaultValues: { is_primary_field: false, irrigation_availability: 'assured' },
  })

  const onSubmit = async (data: FieldForm) => {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('farmer_fields').insert({
      ...data,
      total_area_acres: parseFloat(data.total_area_acres as string),
      area_under_seed_acres: parseFloat(data.area_under_seed_acres as string),
      farmer_id: farmerId,
      state: 'Rajasthan',
      agency_registration_status: 'pending',
      created_by: user?.id,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push(`/farmers/${farmerId}`)
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Field</h1>
          <p className="text-base text-muted-foreground">Land parcel details</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Khasra Number *</label>
          <input {...register('khasra_number')} placeholder="Government khasra/survey number" className={inputCls} />
          {errors.khasra_number && <p className="text-base text-destructive">{errors.khasra_number.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Field Name (optional)</label>
          <input {...register('field_name')} placeholder="e.g. North Field, Main Field" className={inputCls} />
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Khata Number</label>
          <input {...register('khata_number')} placeholder="Khata / Khatauni number" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Village *</label>
            <input {...register('village')} placeholder="Village" className={inputCls} />
            {errors.village && <p className="text-base text-destructive">{errors.village.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Tehsil</label>
            <input {...register('tehsil')} placeholder="Tehsil" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Total Area (acres) *</label>
            <input {...register('total_area_acres')} type="number" step="0.001" placeholder="e.g. 2.500" className={inputCls} />
            {errors.total_area_acres && <p className="text-base text-destructive">{errors.total_area_acres.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Seed Area (acres) *</label>
            <input {...register('area_under_seed_acres')} type="number" step="0.001" placeholder="Seed portion" className={inputCls} />
            {errors.area_under_seed_acres && <p className="text-base text-destructive">{errors.area_under_seed_acres.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Soil Type</label>
          <select {...register('soil_type')} className={selectCls}>
            <option value="">Select soil type</option>
            <option value="sandy">Sandy / बलुई</option>
            <option value="loamy">Loamy / दोमट</option>
            <option value="clay">Clay / चिकनी</option>
            <option value="sandy-loam">Sandy Loam / बलुई दोमट</option>
            <option value="black">Black / काली</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Irrigation Source</label>
            <select {...register('irrigation_source')} className={selectCls}>
              <option value="">Select</option>
              <option value="tubewell">Tubewell</option>
              <option value="canal">Canal</option>
              <option value="rainfed">Rainfed</option>
              <option value="pond">Pond / Tank</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Water Availability</label>
            <select {...register('irrigation_availability')} className={selectCls}>
              <option value="assured">Assured</option>
              <option value="partial">Partial</option>
              <option value="rainfed">Rainfed only</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Govt. Registration Number</label>
          <input {...register('govt_registration_number')} placeholder="Agency portal registration number" className={inputCls} />
        </div>

        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4">
          <input {...register('is_primary_field')} type="checkbox" className="h-6 w-6 rounded accent-brand-700" />
          <span className="text-base font-medium text-gray-700">This is the farmer&apos;s primary field</span>
        </label>

        <button type="submit" disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60">
          {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> Save Field</>}
        </button>
      </form>
    </div>
  )
}
