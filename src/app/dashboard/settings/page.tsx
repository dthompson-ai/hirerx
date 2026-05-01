import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-sky-600">Hire</span>
            <span className="text-xl font-bold text-slate-800">Rx</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Account settings</h1>
        <p className="text-sm text-slate-500 mb-8">
          Set your default benefits package here — it auto-populates on every new job ad.
        </p>

        <SettingsForm profile={profile} />

        <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Subscription</h2>
          <p className="text-sm text-slate-500 mb-4">
            Status: <span className={`font-medium ${
              profile?.subscription_status === 'active' || profile?.subscription_status === 'gifted'
                ? 'text-green-600' : 'text-red-500'
            }`}>
              {profile?.subscription_status === 'gifted' ? 'Active (gifted)' : profile?.subscription_status || 'Inactive'}
            </span>
          </p>
          {profile?.subscription_status === 'active' && profile?.stripe_customer_id && (
            <a
              href={`https://billing.stripe.com/p/login/test_00000`}
              className="text-sm text-sky-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Manage billing →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
