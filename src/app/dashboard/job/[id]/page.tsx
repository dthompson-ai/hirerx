'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { JobAd, ExtractedElement } from '@/lib/types'

// --- Section parsing ---

type SectionType = 'title' | 'opportunity' | 'highlights' | 'what-youll-do' | 'requirements' | 'benefits' | 'cta' | 'other'

interface ParsedSection {
  type: SectionType
  content: string
}

interface RenderGroup {
  isSocial: boolean
  sections: ParsedSection[]
}

const SOCIAL_TYPES = new Set<SectionType>(['opportunity', 'highlights', 'what-youll-do'])

function parseOutputSections(text: string): ParsedSection[] {
  const blocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean)
  const result: ParsedSection[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const firstLine = block.split('\n')[0].trim().toLowerCase()

    if (firstLine === 'apply now.') {
      result.push({ type: 'cta', content: block })
    } else if (firstLine.startsWith("what you'll do as")) {
      result.push({ type: 'what-youll-do', content: block })
    } else if (firstLine.startsWith('preferred candidate might')) {
      result.push({ type: 'requirements', content: block })
    } else if (firstLine === 'benefits') {
      result.push({ type: 'benefits', content: block })
    } else if (i === 0) {
      result.push({ type: 'title', content: block })
    } else {
      const lines = block.split('\n').filter(l => l.trim())
      const allBullets = lines.length > 0 && lines.every(l => l.trim().startsWith('-'))
      const hasOpportunity = result.some(s => s.type === 'opportunity')
      if (allBullets && hasOpportunity) {
        result.push({ type: 'highlights', content: block })
      } else if (!hasOpportunity) {
        result.push({ type: 'opportunity', content: block })
      } else {
        result.push({ type: 'other', content: block })
      }
    }
  }

  return result
}

function groupSections(sections: ParsedSection[]): RenderGroup[] {
  const groups: RenderGroup[] = []

  for (const section of sections) {
    const isSocial = SOCIAL_TYPES.has(section.type)
    const last = groups[groups.length - 1]
    if (last && last.isSocial === isSocial) {
      last.sections.push(section)
    } else {
      groups.push({ isSocial, sections: [section] })
    }
  }

  return groups
}

// --- Tooltip ---

function SocialTooltip() {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="What to do with these sections"
        className="w-5 h-5 rounded-full bg-sky-200 text-sky-700 text-xs font-bold flex items-center justify-center hover:bg-sky-300 transition-colors leading-none"
      >
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

// --- Section renderer ---

function JobAdOutput({ text }: { text: string }) {
  const groups = groupSections(parseOutputSections(text))

  return (
    <div className="space-y-0 font-sans text-sm text-slate-700 leading-relaxed">
      {groups.map((group, gi) =>
        group.isSocial ? (
          <div
            key={gi}
            className="relative bg-sky-50 border border-sky-100 rounded-xl px-5 py-4 my-2"
          >
            <div className="absolute top-3 right-3">
              <SocialTooltip />
            </div>
            {group.sections.map((section, si) => (
              <div key={si} className={si > 0 ? 'mt-4' : ''}>
                <pre className="whitespace-pre-wrap font-sans">{section.content}</pre>
              </div>
            ))}
          </div>
        ) : (
          <div key={gi}>
            {group.sections.map((section, si) => (
              <div
                key={si}
                className={`px-1 py-3 ${section.type === 'cta' ? 'font-semibold text-slate-900' : ''}`}
              >
                <pre className="whitespace-pre-wrap font-sans">{section.content}</pre>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// --- Main page ---

export default function JobAdPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const { id } = use(params)
  const { step: initialStep } = use(searchParams)

  const [jobAd, setJobAd] = useState<JobAd | null>(null)
  const [elements, setElements] = useState<ExtractedElement[]>([])
  const [jobTitle, setJobTitle] = useState('')
  const [view, setView] = useState<'review' | 'output'>(
    initialStep === 'review' ? 'review' : 'output'
  )
  const [assembling, setAssembling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('job_ads')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setJobAd(data as JobAd)
        setElements(data.extracted_elements || [])
        setJobTitle(data.title || '')
        if (data.status === 'complete' && initialStep !== 'review') {
          setView('output')
        } else {
          setView('review')
        }
      }
      setLoading(false)
    }
    load()
  }, [id, initialStep])

  function toggleElement(elId: string) {
    setElements(prev =>
      prev.map(el => el.id === elId ? { ...el, selected: !el.selected } : el)
    )
  }

  function updateElementText(elId: string, text: string) {
    setElements(prev =>
      prev.map(el => el.id === elId ? { ...el, text } : el)
    )
  }

  async function handleAssemble() {
    setAssembling(true)
    const res = await fetch('/api/job-ads/assemble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobAdId: id, elements, jobTitle }),
    })
    const { output } = await res.json()

    setJobAd(prev => prev ? { ...prev, final_output: output, status: 'complete' } : prev)
    setView('output')
    setAssembling(false)
  }

  async function handleCopy() {
    if (!jobAd?.final_output) return
    await navigator.clipboard.writeText(jobAd.final_output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const categoryLabels: Record<string, string> = {
    monetary: 'Monetary opportunity',
    shift: 'Shift opportunity',
    benefits: 'Healthcare / benefits',
    purpose: 'Purpose & mission',
    requirement: 'Requirements',
  }

  const categoryColors: Record<string, string> = {
    monetary: 'bg-green-50 text-green-700 border-green-100',
    shift: 'bg-blue-50 text-blue-700 border-blue-100',
    benefits: 'bg-purple-50 text-purple-700 border-purple-100',
    purpose: 'bg-amber-50 text-amber-700 border-amber-100',
    requirement: 'bg-slate-50 text-slate-600 border-slate-100',
  }

  if (loading) {
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
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Tabs — hidden for template jobs (no extracted elements) */}
        {elements.length > 0 && (
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit">
            <button
              onClick={() => setView('review')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'review' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Review elements
            </button>
            <button
              onClick={() => setView('output')}
              disabled={jobAd?.status !== 'complete'}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'output' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              } disabled:opacity-40`}
            >
              Final job ad
            </button>
          </div>
        )}

        {view === 'review' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-semibold text-slate-900 mb-1">Compelling elements</h2>
              <p className="text-sm text-slate-500 mb-5">
                Check what to include. Edit any text directly — these become your highlight reel and opportunity statement.
              </p>

              {elements.length === 0 ? (
                <div className="text-sm text-slate-400 py-8 text-center">
                  Elements are still generating — refresh in a moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {elements.map(el => (
                    <div
                      key={el.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                        el.selected ? 'bg-white border-sky-200' : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={el.selected}
                        onChange={() => toggleElement(el.id)}
                        className="mt-0.5 rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border inline-block mb-2 ${categoryColors[el.category] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                          {categoryLabels[el.category] || el.category}
                        </span>
                        <textarea
                          value={el.text}
                          onChange={e => updateElementText(el.id, e.target.value)}
                          rows={2}
                          className="w-full text-sm text-slate-800 bg-transparent border-none focus:outline-none resize-none p-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleAssemble}
              disabled={assembling || elements.filter(e => e.selected).length === 0}
              className="w-full bg-sky-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-sky-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {assembling ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assembling your job ad...
                </>
              ) : (
                'Build job ad →'
              )}
            </button>
          </div>
        )}

        {view === 'output' && jobAd?.final_output && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-900">Your job ad</h2>
                <div className="flex gap-2">
                  {elements.length > 0 ? (
                    <button
                      onClick={() => setView('review')}
                      className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
                    >
                      Edit elements
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/template/${id}/edit`}
                      className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
                    >
                      Edit job ad
                    </Link>
                  )}
                  <button
                    onClick={handleCopy}
                    className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-sky-600 text-white hover:bg-sky-700'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                </div>
              </div>

              <JobAdOutput text={jobAd.final_output} />
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl px-5 py-4 text-sm text-sky-700">
              <strong>Ready to post.</strong> Paste this directly into Indeed, your ATS, or anywhere you post jobs.
              Refresh your listing every 2 weeks to stay near the top of search results — your saved ad will be right here.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
