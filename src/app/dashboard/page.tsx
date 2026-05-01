import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JobAd } from '@/lib/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>
}) {
  let isActive = false
  let profile: { agency_name?: string; subscription_status?: string } | null = null
  let jobAds: Partial<JobAd>[] | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = profileData
    isActive = profile?.subscription_status === 'active' || profile?.subscription_status === 'gifted'

    const { data: jobAdsData } = await supabase
      .from('job_ads')
      .select('id, title, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    jobAds = jobAdsData
  } catch {
    // Supabase not configured — render in preview mode
  }

  const params = await searchParams
  const justSubscribed = params.subscribed === 'true'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-sky-600">Hire</span>
            <span className="text-xl font-bold text-slate-800">Rx</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings" className="text-sm text-slate-500 hover:text-slate-800">
              Settings
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button className="text-sm text-slate-500 hover:text-slate-800">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {justSubscribed && (
          <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl px-5 py-4 mb-8 text-sm">
            Welcome to HireRx! Your subscription is active. Let&apos;s write your first job ad.
          </div>
        )}

        {!isActive && (
          <div className="bg-sky-50 border border-sky-100 text-sky-800 rounded-xl px-5 py-4 mb-8 text-sm flex items-start justify-between gap-4">
            <p>
              <strong>You&apos;re on the free plan.</strong> The template builder gives you the framework —
              you fill it in, the app formats it.{' '}
              <a href="/api/stripe/checkout" className="font-medium underline hover:text-sky-900">
                Upgrade to the full plan ($20/month)
              </a>{' '}
              and paste your job description — AI builds the entire ad in seconds.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your job ads</h1>
            <p className="text-sm text-slate-500 mt-1">
              {profile?.agency_name ? `${profile.agency_name} · ` : ''}
              {jobAds?.length || 0} saved
            </p>
          </div>
          <Link
            href={isActive ? '/dashboard/new' : '/dashboard/template/new'}
            className="bg-sky-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
          >
            + New job ad
          </Link>
        </div>

        {!jobAds || jobAds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="text-4xl mb-4">💊</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">No job ads yet</h2>
            <p className="text-sm text-slate-500 mb-6">
              {isActive
                ? 'Your first job ad is one paste away. Drop in a job description and HireRx does the rest.'
                : 'Start with the free template — answer a few questions and the app formats your job ad for you.'}
            </p>
            <Link
              href={isActive ? '/dashboard/new' : '/dashboard/template/new'}
              className="inline-block bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
            >
              {isActive ? 'Write your first job ad' : 'Build your first job ad'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobAds!.map((ad) => (
              <Link
                key={ad.id}
                href={`/dashboard/job/${ad.id}`}
                className="block bg-white rounded-xl border border-slate-100 px-6 py-4 hover:border-sky-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{ad.title || 'Untitled Job Ad'}</p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Last updated {new Date(ad.updated_at!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      ad.status === 'complete'
                        ? 'bg-green-50 text-green-600'
                        : ad.status === 'reviewing'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {ad.status === 'complete' ? 'Complete' : ad.status === 'reviewing' ? 'In review' : 'Draft'}
                    </span>
                    <span className="text-slate-300 text-sm">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
