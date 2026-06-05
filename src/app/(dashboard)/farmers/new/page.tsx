'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Loader2, User, Phone, MapPin, Landmark, Tag } from 'lucide-react'

// Rajasthan districts
const DISTRICTS = [
  'Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara','Bikaner',
  'Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur','Ganganagar',
  'Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur',
  'Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand','Sawai Madhopur',
  'Sikar','Sirohi','Tonk','Udaipur',
]

const PRESET_TAGS = [
  'production-agreement', 'kharif-2025', 'rabi-2025-26', 'vip', 'feedback-needed', 'do-not-contact',
]

const step1Schema = z.object({
  full_name: z.string().min(2, 'Enter full name (at least 2 letters)'),
  primary_phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  village: z.string().min(1, 'Enter village name'),
  district: z.string().min(1, 'Select district'),
})

const step2Schema = z.object({
  father_or_husband_name: z.string().optional(),
  alternate_phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
  whatsapp_number: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

const step3Schema = z.object({
  tehsil: z.string().optional(),
  pin_code: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
})

const step4Schema = z.object({
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
  aadhar_number: z.string().regex(/^\d{4}$/, 'Enter last 4 digits only').optional().or(z.literal('')),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>
type Step4 = z.infer<typeof step4Schema>
const STEPS = [
  { label: 'Basic Info', icon: User },
  { label: 'Contact', icon: Phone },
  { label: 'Address', icon: MapPin },
  { label: 'Bank', icon: Landmark },
  { label: 'Tags', icon: Tag },
]

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-base font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-base text-destructive">{error}</p>}
    </div>
  )
}

const inputCls = 'h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10 disabled:bg-gray-50'
const selectCls = 'h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10'

export default function NewFarmerPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>(['production-agreement'])
  const [formData, setFormData] = useState<Partial<Step1 & Step2 & Step3 & Step4 & Record<string, unknown>>>({})

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema) })
  const form4 = useForm<Step4>({ resolver: zodResolver(step4Schema) })

  const generateCode = async (supabase: ReturnType<typeof createClient>) => {
    const { count } = await supabase.from('farmers').select('*', { count: 'exact', head: true })
    return `CS-RJ-${String((count ?? 0) + 1).padStart(5, '0')}`
  }

  const saveAndContinue = async (data: Record<string, unknown>) => {
    setFormData(prev => ({ ...prev, ...data }))
    if (step < 4) { setStep(s => s + 1); return }

    // Final submit
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const farmerCode = await generateCode(supabase)

    const payload = {
      ...formData,
      ...data,
      farmer_code: farmerCode,
      tags: selectedTags,
      state: 'Rajasthan',
      has_production_agreement: true,
      agreement_status: 'active',
      created_by: user?.id,
    }

    const { data: farmer, error: err } = await supabase.from('farmers').insert(payload).select('id').single()
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push(`/farmers/${farmer.id}`)
  }

  const handleStep = async (formIndex: number, data: Record<string, unknown>) => {
    await saveAndContinue(data)
  }

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold transition ${
              i < step ? 'bg-brand-700 text-white' : i === step ? 'border-2 border-brand-700 bg-brand-50 text-brand-700' : 'border-2 border-gray-200 bg-white text-gray-400'
            }`}>
              {i < step ? <Check className="h-5 w-5" /> : i + 1}
            </div>
            <p className={`mt-1 hidden text-sm font-medium sm:block ${i === step ? 'text-brand-700' : 'text-gray-400'}`}>{s.label}</p>
            {i < STEPS.length - 1 && (
              <div className={`absolute ml-16 h-0.5 w-full max-w-[calc(100%-4rem)] ${i < step ? 'bg-brand-700' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-gray-600 hover:bg-gray-50">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Farmer</h1>
          <p className="text-base text-muted-foreground">{STEPS[step].label}</p>
        </div>
      </div>

      <StepIndicator />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</div>
      )}

      {/* Step 1 — Basic Info */}
      {step === 0 && (
        <form onSubmit={form1.handleSubmit(d => handleStep(0, d))} className="space-y-5">
          <Field label="Farmer Full Name *" error={form1.formState.errors.full_name?.message}>
            <input {...form1.register('full_name')} placeholder="e.g. Ramesh Kumar Sharma" className={inputCls} />
          </Field>
          <Field label="Mobile Number *" error={form1.formState.errors.primary_phone?.message}>
            <input {...form1.register('primary_phone')} type="tel" inputMode="numeric" placeholder="10-digit mobile number" className={inputCls} />
          </Field>
          <Field label="Village *" error={form1.formState.errors.village?.message}>
            <input {...form1.register('village')} placeholder="Village name" className={inputCls} />
          </Field>
          <Field label="District *" error={form1.formState.errors.district?.message}>
            <select {...form1.register('district')} className={selectCls}>
              <option value="">Select district</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <NavButtons saving={saving} />
        </form>
      )}

      {/* Step 2 — Contact */}
      {step === 1 && (
        <form onSubmit={form2.handleSubmit(d => handleStep(1, d))} className="space-y-5">
          <Field label="Father / Husband Name" error={form2.formState.errors.father_or_husband_name?.message}>
            <input {...form2.register('father_or_husband_name')} placeholder="Optional" className={inputCls} />
          </Field>
          <Field label="WhatsApp Number" error={form2.formState.errors.whatsapp_number?.message}>
            <input {...form2.register('whatsapp_number')} type="tel" inputMode="numeric" placeholder="If different from mobile" className={inputCls} />
          </Field>
          <Field label="Alternate Mobile" error={form2.formState.errors.alternate_phone?.message}>
            <input {...form2.register('alternate_phone')} type="tel" inputMode="numeric" placeholder="Optional" className={inputCls} />
          </Field>
          <Field label="Gender">
            <select {...form2.register('gender')} className={selectCls}>
              <option value="">Select gender</option>
              <option value="male">Male / पुरुष</option>
              <option value="female">Female / महिला</option>
              <option value="other">Other / अन्य</option>
            </select>
          </Field>
          <NavButtons saving={saving} />
        </form>
      )}

      {/* Step 3 — Address */}
      {step === 2 && (
        <form onSubmit={form3.handleSubmit(d => handleStep(2, d))} className="space-y-5">
          <div className="rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-base font-medium text-brand-800">State: Rajasthan (fixed)</p>
          </div>
          <Field label="Tehsil / Taluka">
            <input {...form3.register('tehsil')} placeholder="Tehsil name" className={inputCls} />
          </Field>
          <Field label="PIN Code" error={form3.formState.errors.pin_code?.message}>
            <input {...form3.register('pin_code')} type="tel" inputMode="numeric" placeholder="6-digit PIN code" className={inputCls} />
          </Field>
          <NavButtons saving={saving} />
        </form>
      )}

      {/* Step 4 — Bank */}
      {step === 3 && (
        <form onSubmit={form4.handleSubmit(d => handleStep(3, d))} className="space-y-5">
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-800">
            🔒 Bank details are visible to Admin only
          </div>
          <Field label="Bank Name">
            <input {...form4.register('bank_name')} placeholder="e.g. State Bank of India" className={inputCls} />
          </Field>
          <Field label="Account Number">
            <input {...form4.register('bank_account_number')} type="tel" inputMode="numeric" placeholder="Bank account number" className={inputCls} />
          </Field>
          <Field label="IFSC Code">
            <input {...form4.register('bank_ifsc')} placeholder="e.g. SBIN0001234" className={`${inputCls} uppercase`} />
          </Field>
          <Field label="Aadhar — Last 4 digits only" error={form4.formState.errors.aadhar_number?.message}>
            <input {...form4.register('aadhar_number')} type="tel" inputMode="numeric" maxLength={4} placeholder="Last 4 digits only" className={inputCls} />
          </Field>
          <NavButtons saving={saving} />
        </form>
      )}

      {/* Step 5 — Tags & Notes */}
      {step === 4 && (
        <form onSubmit={e => { e.preventDefault(); saveAndContinue({ notes: (e.target as HTMLFormElement).notes?.value || '', agreement_start_date: (e.target as HTMLFormElement).agreement_start_date?.value || '' }) }} className="space-y-5">
          <Field label="Tags (select all that apply)">
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`rounded-full px-4 py-2 text-base font-medium transition ${
                    selectedTags.includes(tag)
                      ? 'bg-brand-700 text-white'
                      : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Agreement Start Date">
            <input name="agreement_start_date" type="date" className={inputCls} />
          </Field>
          <Field label="Internal Notes">
            <textarea name="notes" rows={3} placeholder="Any notes about this farmer…" className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10" />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="h-6 w-6" /> Save Farmer</>}
          </button>
        </form>
      )}
    </div>
  )
}

function NavButtons({ saving }: { saving: boolean }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={saving}
        className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Next <ChevronRight className="h-6 w-6" /></>}
      </button>
    </div>
  )
}
