import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <span className="text-2xl font-bold text-sky-600">Hire</span>
            <span className="text-2xl font-bold text-slate-800">Rx</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-sky-50 text-sky-700 text-sm font-medium px-3 py-1 rounded-full mb-8">
          Built for healthcare staffing recruiters
        </div>

        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Your open roles aren&apos;t filling.<br />
          <span className="text-sky-600">That&apos;s a messaging problem.</span>
        </h1>

        <p className="text-xl text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
          The nurses exist. They&apos;re employed, earning decent money, and not actively looking —
          but they have their ears open. They&apos;re scrolling past your posting because it reads like
          a list of demands, not an opportunity worth considering.
        </p>
        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
          A job <em>description</em> tells candidates what you need from them.
          A job <em>ad</em> tells them what they get — the pay, the shift, the healthcare
          they can actually afford to use. HireRx writes the ad.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-block bg-sky-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-700 transition-colors shadow-lg shadow-sky-100"
          >
            Start free — no credit card
          </Link>
          <Link
            href="/signup"
            className="inline-block border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-lg font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Get the AI — $20/month
          </Link>
        </div>
      </section>

      {/* Before / After */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
          Same nurse, same job. The posting is the only thing that changes.
        </h2>
        <p className="text-slate-500 text-center text-sm mb-12 max-w-lg mx-auto">
          One of these gets scrolled past. The other gets applications.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-red-100 rounded-xl p-6 bg-red-50">
            <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-4">
              Job Description — what you have now
            </div>
            <p className="font-semibold text-slate-800 mb-3">Registered Nurse — Med-Surg</p>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>• Active RN license required</li>
              <li>• Minimum 2 years experience required</li>
              <li>• Must work rotating shifts including nights and weekends</li>
              <li>• Ability to manage high patient load in fast-paced environment</li>
              <li>• Competitive salary and benefits after 90 days</li>
            </ul>
          </div>
          <div className="border border-sky-100 rounded-xl p-6 bg-sky-50">
            <div className="text-xs font-semibold text-sky-500 uppercase tracking-wide mb-4">
              Job Ad — what HireRx writes
            </div>
            <p className="font-semibold text-slate-800 mb-1">Registered Nurse — $38/hr, Days, Weekends Off</p>
            <p className="text-sm text-slate-600 mb-3 italic">
              A Monday–Friday schedule, real earning potential, and healthcare you can afford
              to actually use — starting day one, not day ninety.
            </p>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>✓ $36–$40/hr starting pay with weekly pay</li>
              <li>✓ Monday–Friday days — weekends are yours</li>
              <li>✓ Medical, dental, and vision starting day one — $5 copays</li>
              <li>✓ $1,500 sign-on bonus paid at 90 days</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">Two ways to use HireRx</h2>
          <p className="text-slate-500 text-sm text-center mb-14 max-w-md mx-auto">
            Start free and learn the framework. Or let AI do it in seconds.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free tier */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-5">Free — Template builder</div>
              <div className="space-y-5">
                {[
                  { n: '01', title: 'Build your highlight reel', desc: 'Answer four questions: monetary opportunity, shift opportunity, benefits, and anything else worth highlighting. One item per line — each becomes a bullet.' },
                  { n: '02', title: 'Write the opportunity statement', desc: 'Your highlights become a reference panel. Use the formula to write two sentences that make a nurse stop scrolling.' },
                  { n: '03', title: 'Fill in the rest', desc: 'What you\'ll do, requirements (softly framed), and the full benefits list. The app stitches it into the right order.' },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-4">
                    <span className="text-2xl font-bold text-slate-200 shrink-0 leading-none mt-0.5">{item.n}</span>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1 text-sm">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/signup"
                className="mt-8 block text-center border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                Start free →
              </Link>
            </div>

            {/* Paid tier */}
            <div className="bg-sky-600 rounded-2xl p-8 text-white">
              <div className="text-xs font-semibold text-sky-200 uppercase tracking-wide mb-5">$20/month — AI-powered</div>
              <div className="space-y-5">
                {[
                  { n: '01', title: 'Paste your job description', desc: 'Drop in what you already have — the AI extracts the raw material so you don\'t have to start from scratch.' },
                  { n: '02', title: 'Answer four questions', desc: 'Pay, shift, benefits, and anything else worth highlighting. A minute of input at most.' },
                  { n: '03', title: 'Copy your job ad', desc: 'The full ad is ready — plus a highlighted section that\'s already formatted for social media and SMS. Paste it anywhere.' },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-4">
                    <span className="text-2xl font-bold text-sky-400 shrink-0 leading-none mt-0.5">{item.n}</span>
                    <div>
                      <p className="font-semibold text-white mb-1 text-sm">{item.title}</p>
                      <p className="text-sm text-sky-100">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/signup"
                className="mt-8 block text-center bg-white text-sky-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-50 transition-colors">
                Get the AI →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Simple pricing</h2>
        <p className="text-slate-500 text-center mb-12">Start free. Upgrade when the time savings make it obvious.</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="border border-slate-200 rounded-2xl p-8">
            <div className="text-4xl font-bold text-slate-900 mb-1">Free</div>
            <div className="text-slate-400 text-sm mb-6">No credit card required</div>
            <ul className="text-sm text-slate-700 space-y-3 mb-8">
              {[
                'Guided template builder',
                'Unlimited job ads',
                'Saved ad history',
                'Plain-text output for any platform',
                'Social media & SMS sections built in',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5 shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/signup"
              className="block text-center border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
              Start free
            </Link>
          </div>

          {/* Paid */}
          <div className="border-2 border-sky-500 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Most popular
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">$20</div>
            <div className="text-slate-400 text-sm mb-6">per recruiter / month</div>
            <ul className="text-sm text-slate-700 space-y-3 mb-8">
              {[
                'Everything in free',
                'AI builds the full job ad for you',
                'Paste your job description — done in seconds',
                'AI extracts the most compelling elements',
                'Healthcare-specific intake (facility, specialty, mission)',
                'Account-level benefits defaults',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-sky-500 mt-0.5 shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/signup"
              className="block text-center bg-sky-600 text-white py-3 rounded-xl font-semibold hover:bg-sky-700 transition-colors text-sm">
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <span className="font-semibold text-slate-600">HireRx</span> — Job ads that work for healthcare staffing
      </footer>
    </main>
  )
}
