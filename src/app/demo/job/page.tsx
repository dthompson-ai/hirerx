'use client'

import { useState } from 'react'
import Link from 'next/link'

const mockElements = [
  { id: 'el_1', category: 'monetary', text: '$38–$46/hr — competitive pay for experienced ICU nurses, with overtime available and weekly pay.', selected: true },
  { id: 'el_2', category: 'monetary', text: 'Temp-to-perm opportunity with a pay bump and full benefits when you roll over at 90 days.', selected: true },
  { id: 'el_3', category: 'shift', text: '3 x 12-hour shifts — full-time pay with four days off every week to actually recover.', selected: true },
  { id: 'el_4', category: 'shift', text: 'Night shift available — keep your days free if that fits your life better.', selected: false },
  { id: 'el_5', category: 'benefits', text: '$5 copays and $5 prescriptions after just 30 days. Free telehealth so you\'re not paying out of pocket between paychecks.', selected: true },
  { id: 'el_6', category: 'purpose', text: 'Level II Trauma Center — your patients are the ones who need critical care the most, and your team knows it.', selected: true },
  { id: 'el_7', category: 'requirement', text: 'Current RN license and 2+ years of ICU experience preferred. BLS and ACLS required.', selected: true },
]

const mockOutput = `Registered Nurse — ICU | $46/hr | 3 x 12s | Level II Trauma Center

If you want to work in a unit where the cases are real and the team is tight, this one's worth a look.

We're placing an experienced ICU RN at a Level II Trauma Center — 3 x 12-hour shifts, which means full-time pay and four days off every week. The pay runs $38–$46/hr depending on experience, with overtime available and weekly pay from day one.

Highlights:

- $38–$46/hr, paid weekly
- 3 x 12-hour shifts — four days off every week
- Overtime available, not required
- Temp-to-perm with a pay bump and full benefits at 90 days
- $5 copays, $5 prescriptions starting at 30 days
- Free telehealth — no out-of-pocket between paychecks

What you'll do:

- Provide direct care for critically ill patients in a Level II Trauma Center
- Monitor hemodynamic status, ventilators, and drips and adjust as ordered
- Collaborate with physicians, specialists, and the broader care team
- Document patient condition and interventions accurately each shift

Preferred candidates will have:

- Active RN license in state
- 2+ years of ICU experience
- BLS and ACLS certification
- Comfort with high-acuity, fast-moving cases

Benefits:

- Weekly pay
- $5 copays and $5 prescriptions after 30 days
- Free telehealth services
- Free counseling services
- Vision, dental, and life insurance included
- 401(k) retirement plan
- Scholarship opportunities

Apply now.`

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

export default function DemoJobPage() {
  const [view, setView] = useState<'review' | 'output'>('review')
  const [elements, setElements] = useState(mockElements)
  const [copied, setCopied] = useState(false)

  function toggleElement(id: string) {
    setElements(prev => prev.map(el => el.id === id ? { ...el, selected: !el.selected } : el))
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(mockOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/demo" className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-sky-600">Hire</span>
            <span className="text-xl font-bold text-slate-800">Rx</span>
          </Link>
          <Link href="/demo" className="text-sm text-slate-400 hover:text-slate-600">← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit">
          <button
            onClick={() => setView('review')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'review' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Review elements
          </button>
          <button
            onClick={() => setView('output')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'output' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Final job ad
          </button>
        </div>

        {view === 'review' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-semibold text-slate-900 mb-1">Compelling elements</h2>
              <p className="text-sm text-slate-500 mb-5">
                Check what to include. Edit any text directly — these become your highlight reel and opportunity statement.
              </p>
              <div className="space-y-3">
                {elements.map(el => (
                  <div
                    key={el.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${el.selected ? 'bg-white border-sky-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                  >
                    <input
                      type="checkbox"
                      checked={el.selected}
                      onChange={() => toggleElement(el.id)}
                      className="mt-0.5 rounded shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border inline-block mb-2 ${categoryColors[el.category]}`}>
                        {categoryLabels[el.category]}
                      </span>
                      <p className="text-sm text-slate-800">{el.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setView('output')}
              className="w-full bg-sky-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-sky-700 transition-colors"
            >
              Build job ad →
            </button>
          </div>
        )}

        {view === 'output' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Your job ad</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('review')}
                    className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
                  >
                    Edit elements
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
                  >
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                </div>
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed border border-slate-100 rounded-xl p-5 bg-slate-50">
                {mockOutput}
              </pre>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl px-5 py-4 text-sm text-sky-700">
              <strong>Ready to post.</strong> Paste this directly into Indeed, your ATS, or anywhere you post jobs.
              Refresh your listing every 2 weeks to stay near the top of search results — your saved ad will be right here.
            </div>

            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 text-sm text-center text-slate-500">
              Like what you see?{' '}
              <Link href="/signup" className="text-sky-600 font-medium hover:underline">
                Create an account to build your own.
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
