'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  profile: {
    id: string
    full_name: string
    agency_name: string
    standard_benefits: string
  } | null
}

export default function SettingsForm({ profile }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [agencyName, setAgencyName] = useState(profile?.agency_name || '')
  const [standardBenefits, setStandardBenefits] = useState(profile?.standard_benefits || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ full_name: fullName, agency_name: agencyName, standard_benefits: standardBenefits })
      .eq('id', profile!.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Agency name</label>
          <input
            type="text"
            value={agencyName}
            onChange={e => setAgencyName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Standard benefits package
        </label>
        <p className="text-xs text-slate-400 mb-2">
          These auto-populate on every job ad you create. List the specific benefits your candidates care about — dollar amounts beat vague descriptions.
        </p>
        <textarea
          value={standardBenefits}
          onChange={e => setStandardBenefits(e.target.value)}
          rows={6}
          placeholder="e.g.&#10;- Weekly pay&#10;- $5 copays and $5 prescriptions after 30 days&#10;- Free telehealth services&#10;- Free counseling services&#10;- Vision, dental, and life insurance included&#10;- 401(k) retirement plan&#10;- Scholarship opportunities"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-sky-600 text-white hover:bg-sky-700'
        } disabled:opacity-50`}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save settings'}
      </button>
    </form>
  )
}
