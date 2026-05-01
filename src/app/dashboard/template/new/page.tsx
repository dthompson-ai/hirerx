'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

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

type SectionType = 'title' | 'opportunity' | 'highlights' | 'what-youll-do' | 'requirements' | 'benefits' | 'cta' | 'other'

interface ParsedSection { type: SectionType; content: string }
interface RenderGroup { isSocial: boolean; sections: ParsedSection[] }

const SOCIAL_TYPES = new Set<SectionType>(['opportunity', 'highlights', 'what-youll-do'])

// --- Stitching ---

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

// --- Output section parser + renderer ---

function parseOutputSections(text: string): ParsedSection[] {
  const blocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean)
  const result: ParsedSection[] = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const firstLine = block.split('\n')[0].trim().toLowerCase()
    if (firstLine === 'apply now.') { result.push({ type: 'cta', content: block }); continue }
    if (firstLine.startsWith("what you'll do as")) { result.push({ type: 'what-youll-do', content: block }); continue }
    if (firstLine.startsWith('preferred candidate might')) { result.push({ type: 'requirements', content: block }); continue }
    if (firstLine === 'benefits') { result.push({ type: 'benefits', content: block }); continue }
    if (i === 0) { result.push({ type: 'title', content: block }); continue }
    const lines = block.split('\n').filter(l => l.trim())
    const allBullets = lines.length > 0 && lines.every(l => l.trim().startsWith('-'))
    const hasOpportunity = result.some(s => s.type === 'opportunity')
    if (allBullets && hasOpportunity) { result.push({ type: 'highlights', content: block }); continue }
    if (!hasOpportunity) { result.push({ type: 'opportunity', content: block }); continue }
    result.push({ type: 'other', content: block })
  }
  return result
}

function groupSections(sections: ParsedSection[]): RenderGroup[] {
  const groups: RenderGroup[] = []
  for (const section of sections) {
    const isSocial = SOCIAL_TYPES.has(section.type)
    const last = groups[groups.length - 1]
    if (last && last.isSocial === isSocial) { last.sections.push(section) }
    else { groups.push({ isSocial, sections: [section] }) }
  }
  return groups
}

function SocialTooltip() {
  return (
    <div className="group relative">
      <button type="button" aria-label="What to do with these sections"
        className="w-5 h-5 rounded-full bg-sky-200 text-sky-700 text-xs font-bold flex items-center justify-center hover:bg-sky-300 transition-colors leading-none">
        ?
      </button>
      <div className="absolute right-0 top-7 w-72 bg-slate-900 text-white text-xs rounded-xl px-3.5 py-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed">
        These three sections — the opportunity statement, highlights, and what you&apos;ll do — are your job ad everywhere else.
        Drop them into a social post, use just the opportunity statement as an SMS, or read them as a quick video script.
        The full ad is below.
        <div className="absolute -top-1.5 right-2.5 w-3 h-3 bg-slate-900 rotate-45" />
      </div>
    </div>
  )
}

function JobAdOutput({ text }: { text: string }) {
  const groups = groupSections(parseOutputSections(text))
  return (
    <div className="space-y-0 font-sans text-sm text-slate-700 leading-relaxed">
      {groups.map((group, gi) =>
        group.isSocial ? (
          <div key={gi} className="relative bg-sky-50 border border-sky-100 rounded-xl px-5 py-4 my-2">
            <div className="absolute top-3 right-3"><SocialTooltip /></div>
            {group.sections.map((section, si) => (
              <div key={si} className={si > 0 ? 'mt-4' : ''}>
                <pre className="whitespace-pre-wrap font-sans">{section.content}</pre>
              </div>
            ))}
          </div>
        ) : (
          <div key={gi}>
            {group.sections.map((section, si) => (
              <div key={si} className={`px-1 py-3 ${section.type === 'cta' ? 'font-semibold text-slate-900' : ''}`}>
                <pre className="whitespace-pre-wrap font-sans">{section.content}</pre>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// --- Step progress ---

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

// --- Main page ---

export default function TemplateNewPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState<TemplateForm>({
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
  })

  useEffect(() => {
    async function loadDefaults() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('standard_benefits').eq('id', user.id).single()
        if (profile?.standard_benefits) setForm(prev => ({ ...prev, benefits: profile.standard_benefits }))
      } catch { /* Supabase not connected — skip defaults */ }
    }
    loadDefaults()
  }, [])

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

    // Stitch immediately — no network call needed
    const finalOutput = stitchJobAd(form)
    setOutput(finalOutput)
    setStep(7)
    setSaving(false)

    // Attempt background save — fire and forget, won't block the UI
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('job_ads').insert({
          user_id: user.id,
          title: form.title,
          status: 'complete',
          final_output: finalOutput,
          raw_job_description: '',
          extracted_elements: [],
        }).select('id').single()
        if (data?.id) router.push(`/dashboard/job/${data.id}`)
      }
    } catch { /* Not connected — output is already showing, nothing to do */ }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-sky-600">Hire</span>
            <span className="text-xl font-bold text-slate-800">Rx</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600">← Back to dashboard</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {step <= 6 && <StepProgress step={step} />}

        {/* Step 1 — Job title */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Start with the job title</h2>
              <p className="text-sm text-slate-500">Use the most common, recognizable title for this role — not an internal code name. A nurse searching Indeed should immediately know this is for them.</p>
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
                <p className="text-sm text-slate-500">Before you can write a compelling opportunity statement, you need to know what makes this job worth taking. Answer each question — these become the bullet points that make a nurse stop scrolling.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What&apos;s the monetary opportunity?</label>
                  <p className="text-xs text-slate-400 mb-2">One item per line — each line becomes its own bullet. Lead with pay rate, then add anything else worth calling out: bonuses, overtime, weekly pay, temp-to-perm.</p>
                  <textarea value={form.monetaryHighlight} onChange={e => update('monetaryHighlight', e.target.value)} rows={3}
                    placeholder={`$38–$44/hr starting pay\nWeekly pay\n$1,500 sign-on bonus paid at 90 days`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What&apos;s the shift opportunity?</label>
                  <p className="text-xs text-slate-400 mb-2">One item per line. Don&apos;t just give them the hours — give them what those hours mean for their life. Monday–Friday = weekends off. Three 12s = four days off every week.</p>
                  <textarea value={form.shiftHighlight} onChange={e => update('shiftHighlight', e.target.value)} rows={3}
                    placeholder={`Three 12-hour shifts — four days off every week\nDay shift hours\nRotating weekends only`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What do the benefits and health insurance look like?</label>
                  <p className="text-xs text-slate-400 mb-2">One item per line. &quot;$5 copays&quot; beats &quot;competitive benefits&quot; every time — be specific where you can.</p>
                  <textarea value={form.benefitsHighlight} onChange={e => update('benefitsHighlight', e.target.value)} rows={3}
                    placeholder={`Medical, dental, and vision starting day one\n$5 copays and $5 prescriptions\nFree telehealth`}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What else makes this role worth a serious look? <span className="font-normal text-slate-400">(optional)</span></label>
                  <p className="text-xs text-slate-400 mb-2">One item per line. Mission, patient population, advancement, recognition, stability — anything that gives this job an edge nobody else is talking about.</p>
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
                <p className="text-sm text-slate-500">This is the first thing candidates read — and the most important. Two sentences. Lead with what they get. This same statement is the right length for an SMS message.</p>
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
                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-2">Formula — use it as a starting point, then make it yours</p>
                <p className="text-sm text-sky-800 leading-relaxed italic">
                  &ldquo;An amazing opportunity for a [role / experience level] to [top benefit], [second benefit], and [third benefit] — with solid benefits like [best part of your coverage]. [One sentence about what makes this worth not ignoring.]&rdquo;
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
                <p className="text-sm text-slate-500">Help candidates picture themselves in this role. Specific to this position, not generic filler. One item per line. Aim for 5–7.</p>
              </div>
              <div>
                <textarea value={form.whatYoullDo} onChange={e => update('whatYoullDo', e.target.value)} rows={9}
                  placeholder={`Provide direct patient care for your assigned caseload\nMonitor and respond to changes in patient condition\nCollaborate with physicians and the care team on treatment plans\nDocument care accurately in the EMR\nParticipate in interdisciplinary rounds`}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" autoFocus />
                <p className="text-xs text-slate-400 mt-1.5">One item per line — no dashes needed, we&apos;ll add those.</p>
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
                <p className="text-sm text-slate-500">You&apos;ve already sold them on the opportunity — now you can talk about what you need. Keep this list short: 3–5 items, framed as preferences rather than demands. The more you stack requirements up front, the more candidates you lose before they apply.</p>
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
                <p className="text-sm text-slate-500">This is where you close strong. List every benefit — lead with the most compelling. Candidates read this section when they&apos;re already interested. Don&apos;t leave anything out.</p>
              </div>
              <div>
                <textarea value={form.benefits} onChange={e => update('benefits', e.target.value)} rows={10}
                  placeholder={`Medical, dental, and vision insurance\n401(k) with company match\nPaid time off and holidays\nContinuing education reimbursement\nEmployee referral program`}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono" autoFocus />
                <p className="text-xs text-slate-400 mt-1.5">One item per line. Pre-filled from your account defaults if you&apos;ve saved them.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(5)} className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">← Back</button>
              <button onClick={handleSubmit} disabled={saving || !form.benefits.trim()}
                className="bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-40 flex items-center gap-2">
                {saving ? (
                  <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Building your job ad...</>
                ) : 'Build my job ad →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 7 — Output */}
        {step === 7 && output && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-slate-900">{form.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your job ad is ready to post</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)}
                    className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
                    Start over
                  </button>
                  <button onClick={handleCopy}
                    className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-sky-600 text-white hover:bg-sky-700'}`}>
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                </div>
              </div>
              <JobAdOutput text={output} />
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl px-5 py-4 text-sm text-sky-700">
              <strong>Ready to post.</strong> Paste this directly into Indeed, your ATS, or anywhere you post jobs.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
