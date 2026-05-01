'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const FACILITY_TYPES = [
  'Hospital', 'Nursing Home / SNF', 'Home Health', 'Assisted Living',
  'Outpatient Clinic', 'Rehabilitation Center', 'Behavioral Health', 'Other',
]

const PATIENT_POPULATIONS = [
  'Pediatric', 'Geriatric', 'Adult', 'Trauma', 'Oncology',
  'Rural / Underserved', 'Low-income communities', 'Veterans',
]

const SPECIALTIES = [
  'ICU / Critical Care', 'Emergency / ER', 'Med-Surg', 'Operating Room',
  'Labor & Delivery', 'Telemetry', 'Home Health', 'LTC / SNF',
  'Behavioral Health', 'Dialysis', 'Rehabilitation', 'Radiology',
]

export default function NewJobAdPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [jobAdId, setJobAdId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkSubscription() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/login'); return }
        const { data: profile } = await supabase
          .from('profiles').select('subscription_status').eq('id', user.id).single()
        const isActive = profile?.subscription_status === 'active' || profile?.subscription_status === 'gifted'
        if (!isActive) router.replace('/dashboard/template/new')
      } catch {
        // Supabase not connected — allow access in dev/preview
      } finally {
        setChecking(false)
      }
    }
    checkSubscription()
  }, [router])

  const [form, setForm] = useState({
    title: '',
    raw_job_description: '',
    pay_rate: '',
    weekly_pay: true,
    temp_to_perm: false,
    temp_to_perm_details: '',
    overtime_opportunity: '',
    bonus_details: '',
    shift_raw: '',
    facility_type: '',
    patient_population: [] as string[],
    specialty: [] as string[],
    purpose_other: '',
    benefits_override: '',
  })

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleArray(field: 'patient_population' | 'specialty', value: string) {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let id = jobAdId

    if (!id) {
      const { data, error } = await supabase.from('job_ads').insert({
        user_id: user.id,
        ...form,
        status: 'intake',
      }).select('id').single()

      if (error || !data) {
        setLoading(false)
        return
      }
      id = data.id
      setJobAdId(id)
    } else {
      await supabase.from('job_ads').update({ ...form }).eq('id', id)
    }

    // Trigger AI extraction
    await fetch('/api/job-ads/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobAdId: id }),
    })

    router.push(`/dashboard/job/${id}?step=review`)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-sky-600">Hire</span>
            <span className="text-xl font-bold text-slate-800">Rx</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {['Job details', 'Opportunity', 'Shift & Purpose'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => setStep(i + 1)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  step === i + 1 ? 'text-sky-600' : step > i + 1 ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === i + 1
                    ? 'bg-sky-600 text-white'
                    : step > i + 1
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-slate-100 text-slate-300'
                }`}>
                  {i + 1}
                </span>
                {label}
              </button>
              {i < 2 && <span className="text-slate-200 mx-1">—</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Job details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Start with the job</h2>
              <p className="text-sm text-slate-500">Paste your existing job description. HireRx will extract the raw material.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Registered Nurse — ICU"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job description</label>
              <p className="text-xs text-slate-400 mb-2">Paste your current job description or job posting as-is.</p>
              <textarea
                value={form.raw_job_description}
                onChange={e => update('raw_job_description', e.target.value)}
                rows={10}
                placeholder="Paste your job description here..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.title || !form.raw_job_description}
              className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40"
            >
              Next: Tell us the opportunity →
            </button>
          </div>
        )}

        {/* Step 2: Monetary opportunity */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">The monetary opportunity</h2>
              <p className="text-sm text-slate-500">
                Pay rate is just the starting point. The more context you give, the more compelling the ad.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pay rate</label>
              <input
                type="text"
                value={form.pay_rate}
                onChange={e => update('pay_rate', e.target.value)}
                placeholder="e.g. $32–$38/hr or $75,000/year"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="weekly_pay"
                checked={form.weekly_pay}
                onChange={e => update('weekly_pay', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="weekly_pay" className="text-sm text-slate-700">Weekly pay</label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="temp_to_perm"
                checked={form.temp_to_perm}
                onChange={e => update('temp_to_perm', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="temp_to_perm" className="text-sm text-slate-700">Temp-to-perm opportunity</label>
            </div>

            {form.temp_to_perm && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Details about the perm opportunity</label>
                <input
                  type="text"
                  value={form.temp_to_perm_details}
                  onChange={e => update('temp_to_perm_details', e.target.value)}
                  placeholder="e.g. Pay bump + benefits at 90 days, bonus at rollover"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Overtime opportunity</label>
              <input
                type="text"
                value={form.overtime_opportunity}
                onChange={e => update('overtime_opportunity', e.target.value)}
                placeholder="e.g. Available but not required, or weekly overtime common"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bonuses</label>
              <input
                type="text"
                value={form.bonus_details}
                onChange={e => update('bonus_details', e.target.value)}
                placeholder="e.g. $500 sign-on, referral bonuses, performance bonuses"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Benefits package <span className="text-slate-400 font-normal">(leave blank to use account defaults)</span>
              </label>
              <textarea
                value={form.benefits_override}
                onChange={e => update('benefits_override', e.target.value)}
                rows={4}
                placeholder="e.g. $5 copays, $5 prescriptions, free telehealth — or leave blank to use your saved defaults"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
              >
                Next: Shift & purpose →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Shift & purpose */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Shift & purpose</h2>
              <p className="text-sm text-slate-500">
                The shift isn&apos;t just hours — it&apos;s how this job fits someone&apos;s life. Purpose is what makes healthcare different.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shift details</label>
              <p className="text-xs text-slate-400 mb-2">
                Give us the raw facts. HireRx translates them. Example: &quot;M-F 7am-3pm&quot; → &quot;Set schedule with weekends off.&quot;
              </p>
              <input
                type="text"
                value={form.shift_raw}
                onChange={e => update('shift_raw', e.target.value)}
                placeholder="e.g. 3 x 12-hour shifts, nights, rotating weekends"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Facility type</label>
              <select
                value={form.facility_type}
                onChange={e => update('facility_type', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">Select facility type</option>
                {FACILITY_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Patient population <span className="text-slate-400 font-normal">(select all that apply)</span></label>
              <div className="flex flex-wrap gap-2">
                {PATIENT_POPULATIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleArray('patient_population', p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.patient_population.includes(p)
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Specialty <span className="text-slate-400 font-normal">(select all that apply)</span></label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleArray('specialty', s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.specialty.includes(s)
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mission / purpose context <span className="text-slate-400 font-normal">(optional but powerful)</span>
              </label>
              <textarea
                value={form.purpose_other}
                onChange={e => update('purpose_other', e.target.value)}
                rows={3}
                placeholder="e.g. Only rural hospital within 60 miles. Patients here have no other option — the team knows it and takes real pride in that."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">The more specific and real this is, the more the ad will stand out.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.shift_raw}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Building your ad...
                  </>
                ) : (
                  'Generate job ad →'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
