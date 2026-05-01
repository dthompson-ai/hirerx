import Link from 'next/link'

const mockAds = [
  { id: 'rn-icu', title: 'Registered Nurse — ICU', status: 'complete', updated: '2026-04-28' },
  { id: 'cna-snf', title: 'Certified Nursing Assistant — SNF', status: 'complete', updated: '2026-04-22' },
  { id: 'lpt-er', title: 'LPN — Emergency Department', status: 'reviewing', updated: '2026-04-19' },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-sky-600">Hire</span>
            <span className="text-xl font-bold text-slate-800">Rx</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 italic">Demo mode</span>
            <Link href="/dashboard/settings" className="text-sm text-slate-500 hover:text-slate-800">Settings</Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-5 py-3 mb-8 text-sm">
          You&apos;re viewing a demo. <Link href="/signup" className="font-medium underline">Create an account</Link> to save your own job ads.
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your job ads</h1>
            <p className="text-sm text-slate-500 mt-1">Apex Healthcare Staffing · 3 saved</p>
          </div>
          <Link
            href="/demo/new"
            className="bg-sky-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
          >
            + New job ad
          </Link>
        </div>

        <div className="space-y-3">
          {mockAds.map((ad) => (
            <Link
              key={ad.id}
              href={`/demo/job?id=${ad.id}`}
              className="block bg-white rounded-xl border border-slate-100 px-6 py-4 hover:border-sky-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{ad.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">Last updated {ad.updated}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    ad.status === 'complete'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {ad.status === 'complete' ? 'Complete' : 'In review'}
                  </span>
                  <span className="text-slate-300 text-sm">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
