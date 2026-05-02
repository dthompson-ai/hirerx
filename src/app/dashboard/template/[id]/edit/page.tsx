'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface TemplateForm {
  title: string
  monetaryHighlight: string
  shiftHighlight: string
  benefitsHighlight: string
  otherHighlight: string
  extraHighlights: string[]
  opportunityStatement: string
  whatYoullDo: string
  requirements: string
  benefits: string
}

const EMPTY_FORM: TemplateForm = {
  title: '',
  monetaryHighlight: '',
  shiftHighlight: '',
  benefitsHighlight: '',
  otherHighlight: '',
  extraHighlights: [],
  opportunityStatement: '',
  whatYoullDo: '',
  requirements: '',
  benefits: '',
}

function bulletify(text: string): string {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => l.startsWith('-') ? l : `- ${l}`).join('\n')
}

function buildHighlights(form: TemplateForm): string[] {
  const fromFields = [form.monetaryHighlight, form.shiftHighlight, form.benefitsHighlight, form.otherHighlight]
    .flatMap(field => field.split('\n').map(l => l.trim()).filter(Boolean))
  const fromExtras = form.extraHighlights.map(h => h.trim()).filter(Boolean)
  return [...fromFields, ...fromExtras]
}

function stitchJobAd(form: TemplateForm): string {
  const highlights = buildHighlights(form).map(h => `- ${h.replace(/^-\s*/, '')}`).join('\n')
  const sections: string[] = []
  sections.push(form.title)
  sections.push(form.opportunityStatement.trim())
  if (highlights) sections.push(highlights)
  const whatYoullDo = bulletify(form.whatYoullDo)
  if (whatYoullDo) sections.push(`What you'll do as a ${form.title}\n${whatYoullDo}`)
  const requirements = bulletify(form.requirements)
  if (requirements) sections.push(`Preferred Candidate Might...\n${requirements}`)
  const benefits = bulletify(form.benefits)
  if (benefits) sections.push(`Benefits\n${benefits}`)
  sections.push('Apply now.')
  return sections.join('\n\n')
}

const STEPS = ['The job', 'Highlights', 'Opportunity', "What you'll do", 'Requirements', 'Benefits']

function StepProgress({ step }: { step: number }) {
  const total = STEPS.length
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-sky-600">Step {step} of {total}</span>
        <span className="text-sm text-slate-500">{STEPS[step - 1]}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  )
}

export default function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM)

  useEffect(() => {
    async function loadJob() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('job_ads')
        .select('raw_job_description, title')
        .eq('id', id)
        .single()

      if (error || !data) { setLoadError(true); return }

      try {
        const saved = JSON.parse(data.raw_job_description)
        setForm({ ...EMPTY_FORM, ...saved })
      } catch {
        // raw_job_description isn't JSON (older job) — seed title at minimum
        setForm({ ...EMPTY_FORM, title: data.title || '' })
      }
    }
    loadJob()
  }, [id])

  function update(field: keyof TemplateForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateExtra(index: number, value: string) {
    setForm(prev => {
      const updated = [...prev.extraHighlights]
      updated[index] = value
      return { ...prev, extraHighlights: updated }
    })
  }

  function addExtra() {
    setForm(prev => ({ ...prev, extraHighlights: [...prev.extraHighlights, ''] }))
  }

  const highlights = buildHighlights(form)

  async function handleSubmit() {
    setSaving(true)
    const finalOutput = stitchJobAd(form)

    const supabase = createClient()
    await supabase.from('job_ads').update({
      title: form.title,
      final_output: finalOutput,
      raw_job_description: JSON.stringify(form),
    }).eq('id', id)

    router.push(`/dashboard/job/${id}`)
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Couldn&apos;t load this job ad. <Link href="/dashboard" className="text-sky-600 underline">Back to dashboard</Link></div>
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
          <Link href={`/dashboard/job/${id}`} className="text-sm text-slate-400 hover:text-slate-600">← Back to job ad</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <StepProgress step={step} />

        {/* Step 1 — Job title */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Start with the job title</h2>
              <p className="text-sm text-slate-500">Use the most common, recognizable title for this role — not an internal code name.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job title</label>
              <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="e.g. Registered Nurse — ICU, LPN, CNA — Memory Care"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" autoFocus />
            </div>
            <button onClick={() => setStep(2)} disabled={!form.title.trim()}
              className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40">
              Next: Build your highlights →
            </button>
          </div>
        )}

        {/* Step 2 — Highlights */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Build your highlight reel</h2>
                <p className="text-sm text-slate-500">These become the bullet points that make a nurse stop scrolling.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What&apos;s the monetary opportunity?</label>
                  <p className="text-xs text-slate-400 mb-2">One item per line. Lead with pay rate, then bonuses, overtime, weekly pay.</p>
                  <textarea value={form.monetaryHighlight} onChange={e => update('monetaryHighlight', e.target.value)} rows={3}
                    placeholder={`$38–$44/hr starting pay\nWeekly pay\n$1,500 sign-on bonus paid at 90 days`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What&apos;s the shift opportunity?</label>
                  <p className="text-xs text-slate-400 mb-2">One item per line. Tell them what the hours mean for their life.</p>
                  <textarea value={form.shiftHighlight} onChange={e => update('shiftHighlight', e.target.value)} rows={3}
                    placeholder={`Three 12-hour shifts — four days off every week\nDay shift hours\nRotating weekends only`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What do the benefits and health insurance look like?</label>
                  <p className="text-xs text-slate-400 mb-2">One item per line. Be specific — &quot;$5 copays&quot; beats &quot;competitive benefits&quot;.</p>
                  <textarea value={form.benefitsHighlight} onChange={e => update('benefitsHighlight', e.target.value)} rows={3}
                    placeholder={`Medical, dental, and vision starting day one\n$5 copays and $5 prescriptions\nFree telehealth`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What else makes this role worth a serious look? <span className="font-normal text-slate-400">(optional)</span></label>
                  <p className="text-xs text-slate-400 mb-2">Mission, advancement, stability — anything that gives this job an edge.</p>
                  <textarea value={form.otherHighlight} onChange={e => update('otherHighlight', e.target.value)} rows={3}
                    placeholder={`Only Level III NICU within 80 miles\nClear path to charge nurse within 18 months`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" />
                </div>
                {form.extraHighlights.map((h, i) => (
                  <div key={i}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Extra highlight {i + 1}</label>
                    <input type="text" value={h} onChange={e => updateExtra(i, e.target.value)}
                      placeholder="One more reason to apply..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                ))}
                {form.extraHighlights.length < 3 && (
                  <button type="button" onClick={addExtra} className="text-sm text-sky-600 hover:text-sky-700 font-medium">
                    + Add another highlight
                  </button>
                )}
              </div>
            </div>

            {highlights.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your highlight reel so far</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${highlights.length >= 5 ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {highlights.length} {highlights.length === 1 ? 'highlight' : 'highlights'} · target 5–7
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                      <span className="text-sky-400 mt-0.5 shrink-0">—</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">← Back</button>
              <button onClick={() => setStep(3)} disabled={highlights.length < 2}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40">
                Next: Write the opportunity statement →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Opportunity Statement */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Write your opportunity statement</h2>
                <p className="text-sm text-slate-500">Two sentences. Lead with what they get. This same statement is the right length for an SMS message.</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Your highlights — use these</p>
                <ul className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-sky-500 shrink-0">—</span><span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-2">Formula</p>
                <p className="text-sm text-sky-800 leading-relaxed italic">
                  &ldquo;An amazing opportunity for a [role] to [top benefit], [second benefit], and [third benefit] — with solid benefits like [best part of your coverage]. [One sentence about what makes this worth not ignoring.]&rdquo;
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your opportunity statement <span className="text-slate-400 font-normal">(2 sentences)</span></label>
                <textarea value={form.opportunityStatement} onChange={e => update('opportunityStatement', e.target.value)}
                  rows={4} placeholder="Write 2 sentences that make a nurse stop scrolling..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" autoFocus />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">← Back</button>
              <button onClick={() => setStep(4)} disabled={!form.opportunityStatement.trim()}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40">
                Next: What you&apos;ll do →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — What You'll Do */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">What you&apos;ll do as a {form.title}</h2>
                <p className="text-sm text-slate-500">Help candidates picture themselves in this role. One item per line. Aim for 5–7.</p>
              </div>
              <div>
                <textarea value={form.whatYoullDo} onChange={e => update('whatYoullDo', e.target.value)} rows={9}
                  placeholder={`Provide direct patient care for your assigned caseload\nMonitor and respond to changes in patient condition\nCollaborate with physicians and the care team on treatment plans\nDocument care accurately in the EMR\nParticipate in interdisciplinary rounds`}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" autoFocus />
                <p className="text-xs text-slate-400 mt-1.5">One item per line — no dashes needed.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">← Back</button>
              <button onClick={() => setStep(5)} disabled={!form.whatYoullDo.trim()}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40">
                Next: Requirements →
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Requirements */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Preferred Candidate Might...</h2>
                <p className="text-sm text-slate-500">Keep this short: 3–5 items, framed as preferences rather than demands.</p>
              </div>
              <div>
                <textarea value={form.requirements} onChange={e => update('requirements', e.target.value)} rows={6}
                  placeholder={`Hold an active RN license in [state]\nHave 2+ years of ICU or critical care experience\nBLS and ACLS certified`}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" autoFocus />
                <p className="text-xs text-slate-400 mt-1.5">One item per line. Less is more here.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">← Back</button>
              <button onClick={() => setStep(6)} disabled={!form.requirements.trim()}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40">
                Next: Benefits →
              </button>
            </div>
          </div>
        )}

        {/* Step 6 — Benefits */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">The full benefits package</h2>
                <p className="text-sm text-slate-500">List every benefit — lead with the most compelling. Don&apos;t leave anything out.</p>
              </div>
              <div>
                <textarea value={form.benefits} onChange={e => update('benefits', e.target.value)} rows={10}
                  placeholder={`Medical, dental, and vision insurance\n401(k) with company match\nPaid time off and holidays\nContinuing education reimbursement\nEmployee referral program`}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" autoFocus />
                <p className="text-xs text-slate-400 mt-1.5">One item per line.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(5)} className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">← Back</button>
              <button onClick={handleSubmit} disabled={saving || !form.benefits.trim()}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40 flex items-center gap-2">
                {saving ? (
                  <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving your job ad...</>
                ) : 'Save changes →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
