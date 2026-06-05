'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Camera, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, Check } from 'lucide-react'
import { db } from '@/lib/offline/db'

type Assignment = {
  id: string
  inspection_number: number
  inspection_type: string
  scheduled_date: string
  notes_for_inspector: string | null
  production_agreements: {
    id: string
    agreement_number: string
    sowing_date: string | null
    farmers: { full_name: string; village: string }
    farmer_fields: { field_name: string | null; centroid_lat: number | null; centroid_lng: number | null } | null
    crop_varieties: { crop_name: string; variety_code: string }
  }
}

const CROP_STAGES = ['Vegetative / बढ़वार', 'Tillering / कल्ले', 'Flowering / फूल', 'Grain Fill / दाना', 'Maturity / पकाव']
const PLANT_STAND = ['Excellent / उत्तम', 'Good / अच्छा', 'Fair / ठीक', 'Poor / खराब']
const INFESTATION = ['Nil / नहीं', 'Light / हल्का', 'Moderate / मध्यम', 'Heavy / भारी']
const PEST_LEVELS = ['Nil / नहीं', 'Mild / हल्का', 'Moderate / मध्यम', 'Severe / गंभीर']

function RadioGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-base font-medium text-gray-700">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`rounded-xl border-2 px-3 py-3 text-left text-base font-medium transition ${value === opt ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-input bg-white text-gray-700 hover:border-gray-300'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ConductInspectionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [photos, setPhotos] = useState<{ file: File; preview: string; caption: string }[]>([])
  const [cropStage, setCropStage] = useState('')
  const [plantStand, setPlantStand] = useState('')
  const [weedInfestation, setWeedInfestation] = useState('')
  const [pestStatus, setPestStatus] = useState('')
  const [pestDetails, setPestDetails] = useState('')
  const [isolationMet, setIsolationMet] = useState<boolean | null>(null)
  const [isolationMeters, setIsolationMeters] = useState('')
  const [offTypePct, setOffTypePct] = useState('0')
  const [estimatedYield, setEstimatedYield] = useState('')
  const [overallStatus, setOverallStatus] = useState<'pass' | 'conditional-pass' | 'fail' | ''>('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [observations, setObservations] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [sowingDate, setSowingDate] = useState('')

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('inspection_assignments')
        .select(`id, inspection_number, inspection_type, scheduled_date, notes_for_inspector,
          production_agreements(id, agreement_number, sowing_date, farmers(full_name, village), farmer_fields(field_name, centroid_lat, centroid_lng), crop_varieties(crop_name, variety_code))`)
        .eq('id', id)
        .single()
      setAssignment(data as unknown as Assignment)
      setSowingDate((data as unknown as Assignment)?.production_agreements?.sowing_date ?? '')
      setLoading(false)
    }
    load()
  }, [id])

  const captureGPS = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setGpsLoading(false)
      },
      () => { setError('Could not get GPS location. Try again.'); setGpsLoading(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPhotos(prev => [...prev, { file, preview: ev.target?.result as string, caption: '' }])
      reader.readAsDataURL(file)
    })
  }

  const uploadPhoto = async (supabase: ReturnType<typeof createClient>, inspectionId: string, photo: { file: File; caption: string }) => {
    const ext = photo.file.name.split('.').pop()
    const path = `inspections/${inspectionId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('inspection-photos').upload(path, photo.file)
    if (error) return
    const { data: { publicUrl } } = supabase.storage.from('inspection-photos').getPublicUrl(path)
    await supabase.from('inspection_photos').insert({ inspection_id: inspectionId, photo_url: publicUrl, caption: photo.caption, is_synced: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignment) return
    if (!cropStage || !plantStand || !overallStatus) {
      setError('Please complete all required fields (crop stage, plant stand, overall status).')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      assignment_id: id,
      production_agreement_id: assignment.production_agreements.id,
      inspection_number: assignment.inspection_number,
      inspection_date: new Date().toISOString().split('T')[0],
      inspection_time: new Date().toTimeString().slice(0, 5),
      gps_lat: gps?.lat,
      gps_lng: gps?.lng,
      gps_accuracy_meters: gps?.accuracy,
      gps_captured_at: gps ? new Date().toISOString() : null,
      crop_stage: cropStage.split(' / ')[0].toLowerCase().replace(/ /g, '-'),
      plant_stand: plantStand.split(' / ')[0].toLowerCase(),
      weed_infestation: weedInfestation.split(' / ')[0].toLowerCase(),
      pest_disease_status: pestStatus.split(' / ')[0].toLowerCase(),
      pest_disease_details: pestDetails,
      isolation_distance_met: isolationMet,
      isolation_distance_meters: isolationMeters ? parseFloat(isolationMeters) : null,
      off_type_percentage: parseFloat(offTypePct) || 0,
      estimated_yield_quintals: estimatedYield ? parseFloat(estimatedYield) : null,
      overall_status: overallStatus,
      rejection_reason: rejectionReason,
      recommendation,
      field_observations: observations,
      follow_up_required: followUp,
      submitted_at: new Date().toISOString(),
    }

    if (!isOnline) {
      // Save offline
      await db.draftInspections.add({
        id: `draft-${Date.now()}`,
        assignmentId: id,
        productionAgreementId: assignment.production_agreements.id,
        inspectorId: '',
        data: payload,
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSynced: false,
      })
      setSaving(false)
      router.push('/dashboard')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: inspection, error: err } = await supabase.from('inspections')
      .insert({ ...payload, inspector_id: user?.id, is_synced: true })
      .select('id').single()

    if (err) { setError(err.message); setSaving(false); return }

    // Upload photos
    await Promise.all(photos.map(p => uploadPhoto(supabase, inspection.id, p)))

    // Mark assignment complete
    await supabase.from('inspection_assignments').update({ status: 'completed' }).eq('id', id)

    setSaving(false)
    router.push('/dashboard')
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-brand-700" />
    </div>
  )

  if (!assignment) return (
    <div className="mx-auto max-w-lg p-6 text-center">
      <p className="text-lg text-gray-600">Inspection not found.</p>
      <button onClick={() => router.back()} className="mt-4 text-brand-700 hover:underline">Go back</button>
    </div>
  )

  const agr = assignment.production_agreements

  return (
    <div className="mx-auto max-w-2xl pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Inspection</h1>
          <p className="text-base text-muted-foreground">Visit #{assignment.inspection_number} · {assignment.inspection_type === 'additional' ? 'Additional' : 'Standard'}</p>
        </div>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3">
          <AlertCircle className="h-6 w-6 text-amber-600" />
          <p className="text-base font-medium text-amber-800">You are offline. Your inspection will be saved and uploaded later.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Farm info */}
        <div className="rounded-2xl border-2 bg-brand-50 p-5">
          <p className="text-xl font-bold text-gray-900">{agr.farmers.full_name}</p>
          <p className="text-lg text-muted-foreground">{agr.farmers.village} · {agr.crop_varieties.crop_name} {agr.crop_varieties.variety_code}</p>
          <p className="text-base text-muted-foreground">{agr.agreement_number}</p>
          {assignment.notes_for_inspector && (
            <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-base text-amber-900">📝 {assignment.notes_for_inspector}</p>
          )}
        </div>

        {/* Sowing date confirm */}
        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Confirm Sowing Date</label>
          <input type="date" value={sowingDate} onChange={e => setSowingDate(e.target.value)}
            className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10" />
        </div>

        {/* GPS */}
        <div className="space-y-3">
          <p className="text-base font-medium text-gray-700">GPS Location</p>
          <button type="button" onClick={captureGPS} disabled={gpsLoading}
            className={`flex h-14 w-full items-center justify-center gap-3 rounded-xl border-2 text-lg font-semibold transition ${gps ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-gray-300 bg-white text-gray-700 hover:border-brand-300'}`}>
            {gpsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <MapPin className="h-6 w-6" />}
            {gps ? `📍 ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (±${Math.round(gps.accuracy)}m)` : 'Capture My Location'}
          </button>
          {gps && gps.accuracy > 20 && (
            <p className="text-base text-amber-600">⚠️ Low accuracy (±{Math.round(gps.accuracy)}m). Move to open area and try again.</p>
          )}
        </div>

        {/* Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-base font-medium text-gray-700">Photos ({photos.length})</p>
            {photos.length < 2 && <p className="text-sm text-amber-600">Minimum 2 required</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} capture="environment" />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 text-lg font-medium text-gray-600 hover:border-brand-400 hover:text-brand-700">
            <Camera className="h-7 w-7" /> Take / Add Photos
          </button>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-full w-full rounded-xl object-cover" />
                  <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crop observations */}
        <div className="space-y-5 rounded-2xl border-2 p-5">
          <p className="text-xl font-bold text-gray-900">Crop Observations</p>
          <RadioGroup label="Crop Stage / फसल अवस्था *" options={CROP_STAGES} value={cropStage} onChange={setCropStage} />
          <RadioGroup label="Plant Stand / फसल स्थिति *" options={PLANT_STAND} value={plantStand} onChange={setPlantStand} />
          <RadioGroup label="Weed Infestation / खरपतवार" options={INFESTATION} value={weedInfestation} onChange={setWeedInfestation} />
          <RadioGroup label="Pest / Disease / कीट रोग" options={PEST_LEVELS} value={pestStatus} onChange={setPestStatus} />
          {pestStatus && !pestStatus.startsWith('Nil') && (
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-700">Pest / Disease Details</label>
              <textarea value={pestDetails} onChange={e => setPestDetails(e.target.value)} rows={2} placeholder="Describe pest or disease…"
                className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-lg outline-none transition focus:border-brand-700" />
            </div>
          )}
        </div>

        {/* Isolation */}
        <div className="space-y-3 rounded-2xl border-2 p-5">
          <p className="text-xl font-bold text-gray-900">Isolation Distance</p>
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map(v => (
              <button key={String(v)} type="button" onClick={() => setIsolationMet(v)}
                className={`flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-lg font-semibold transition ${isolationMet === v ? (v ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-red-500 bg-red-50 text-red-700') : 'border-input bg-white text-gray-700'}`}>
                {v ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                {v ? 'Met / ठीक है' : 'Not Met / नहीं है'}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Isolation Distance (meters)</label>
            <input type="number" value={isolationMeters} onChange={e => setIsolationMeters(e.target.value)} placeholder="Distance in meters"
              className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700" />
          </div>
        </div>

        {/* Off-type % */}
        <div className="space-y-3 rounded-2xl border-2 p-5">
          <p className="text-xl font-bold text-gray-900">Rogue Plants / Off-Type</p>
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Off-Type % (enter 0 if none)</label>
            <input type="number" step="0.01" min="0" max="100" value={offTypePct} onChange={e => setOffTypePct(e.target.value)}
              className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700" />
          </div>
          {parseFloat(offTypePct) > 1 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-700">
              <AlertCircle className="h-5 w-5" /> {offTypePct}% rogue plants — exceeds 1% threshold!
            </div>
          )}
        </div>

        {/* Yield estimate */}
        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Estimated Yield (quintals)</label>
          <input type="number" step="0.1" value={estimatedYield} onChange={e => setEstimatedYield(e.target.value)} placeholder="Expected yield in quintals"
            className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700" />
        </div>

        {/* Overall status */}
        <div className="space-y-3">
          <p className="text-base font-medium text-gray-700">Overall Assessment *</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'pass', label: 'Pass', emoji: '✅', cls: 'border-brand-700 bg-brand-50 text-brand-800' },
              { value: 'conditional-pass', label: 'Conditional', emoji: '⚠️', cls: 'border-amber-500 bg-amber-50 text-amber-800' },
              { value: 'fail', label: 'Fail', emoji: '❌', cls: 'border-red-500 bg-red-50 text-red-700' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setOverallStatus(opt.value as typeof overallStatus)}
                className={`flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 text-base font-bold transition ${overallStatus === opt.value ? opt.cls : 'border-input bg-white text-gray-600 hover:border-gray-300'}`}>
                <span className="text-2xl">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {overallStatus && overallStatus !== 'pass' && (
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-700">Reason / Remarks *</label>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3} placeholder="Why conditional or fail? What action needed?"
              className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-lg outline-none transition focus:border-brand-700" />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Field Observations</label>
          <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3} placeholder="Any other observations about the field…"
            className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-lg outline-none transition focus:border-brand-700" />
        </div>

        <div className="space-y-2">
          <label className="text-base font-medium text-gray-700">Recommendation</label>
          <textarea value={recommendation} onChange={e => setRecommendation(e.target.value)} rows={2} placeholder="What should the farmer do next?"
            className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-lg outline-none transition focus:border-brand-700" />
        </div>

        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4">
          <input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)} className="h-6 w-6 rounded accent-brand-700" />
          <span className="text-base font-medium text-gray-700">Follow-up visit required</span>
        </label>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</div>
        )}

        <button type="submit" disabled={saving || photos.length < 2}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60">
          {saving ? <Loader2 className="h-7 w-7 animate-spin" /> : <><Check className="h-7 w-7" /> {isOnline ? 'Submit Inspection' : 'Save Offline'}</>}
        </button>
        {photos.length < 2 && <p className="text-center text-base text-amber-600">Add at least 2 photos to submit</p>}
      </form>
    </div>
  )
}
