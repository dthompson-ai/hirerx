'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPro = searchParams.get('plan') === 'pro'

  const [fullName, setFullName] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (/[&<>"']/.test(password)) {
      setError('Password contains an unsupported character. Avoid: & < > " \'')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').update({ agency_name: agencyName }).eq('id', data.user.id)
    }

    if (!isPro) {
      router.push('/dashboard')
      return
    }

    // Pro path — redirect to Stripe checkout
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const { url } = await res.json()

    if (url) {
      window.location.href = url
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-0.5 mb-8">
        <span className="text-2xl font-bold text-sky-600">Hire</span>
        <span className="text-2xl font-bold text-slate-800">Rx</span>
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
        {isPro && (
          <p className="text-sm text-slate-500 mb-6">$20/month — cancel anytime</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-4 ${!isPro ? 'mt-6' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Agency name</label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Work email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs text-slate-400 mt-1">8+ characters. Avoid: &amp; &lt; &gt; &quot; &apos;</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : isPro ? 'Continue to payment' : 'Create free account'}
          </button>
        </form>

        {isPro && (
          <p className="text-xs text-slate-400 text-center mt-4">
            You&apos;ll be taken to Stripe to complete payment securely.
          </p>
        )}

        <p className="text-sm text-slate-500 text-center mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
