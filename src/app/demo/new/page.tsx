import Link from 'next/link'

export default function DemoNewPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/demo" className="flex items-center gap-0.5">
            <span className="text-xl font-bold text-sky-600">Hire</span>
            <span className="text-xl font-bold text-slate-800">Rx</span>
          </Link>
          <Link href="/demo" className="text-sm text-slate-400 hover:text-slate-600">← Back to dashboard</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-10">
          {['Job details', 'Opportunity', 'Shift & Purpose'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 text-sm font-medium ${i === 0 ? 'text-sky-600' : 'text-slate-300'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                  {i + 1}
                </span>
                {label}
              </div>
              {i < 2 && <span className="text-slate-200 mx-1">—</span>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Start with the job</h2>
            <p className="text-sm text-slate-500">Paste your existing job description. HireRx will extract the raw material.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job title</label>
            <input
              type="text"
              defaultValue="Registered Nurse — ICU"
              readOnly
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job description</label>
            <p className="text-xs text-slate-400 mb-2">Paste your current job description or job posting as-is.</p>
            <textarea
              readOnly
              rows={10}
              defaultValue={`ICU Registered Nurse

We are seeking an experienced ICU RN to join our team.

Responsibilities:
- Provide direct patient care in the intensive care unit
- Monitor patients and administer medications
- Collaborate with physicians and care team
- Document patient status and care provided
- Must be able to work rotating shifts including nights and weekends

Requirements:
- Current RN license in state
- Minimum 2 years ICU experience required
- BLS and ACLS certification required
- Strong critical thinking skills
- Ability to lift 50 lbs`}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
            This is a demo — inputs are read-only.{' '}
            <Link href="/signup" className="font-medium underline">Create an account</Link> to build real job ads.
          </div>

          <Link
            href="/demo/job?id=rn-icu"
            className="inline-block bg-sky-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
          >
            See the output →
          </Link>
        </div>
      </div>
    </div>
  )
}
