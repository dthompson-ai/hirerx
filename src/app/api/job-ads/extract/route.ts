import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    console.error('[extract] auth failed', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobAdId } = await request.json()
  console.log('[extract] request for job', jobAdId, 'user', user.id)

  const { data: jobAd, error: jobError } = await supabase
    .from('job_ads')
    .select('*')
    .eq('id', jobAdId)
    .eq('user_id', user.id)
    .single()

  if (!jobAd) {
    console.error('[extract] job not found', jobAdId, jobError)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  console.log('[extract] calling Anthropic for job', jobAdId)

  const { data: profile } = await supabase
    .from('profiles')
    .select('standard_benefits')
    .eq('id', user.id)
    .single()

  const benefits = jobAd.benefits_override || profile?.standard_benefits || ''

  const shiftContext = buildShiftContext(jobAd.shift_raw)
  const monetaryContext = buildMonetaryContext(jobAd)
  const purposeContext = buildPurposeContext(jobAd)

  const prompt = `You are an expert healthcare staffing recruiter copywriter. Your job is to extract the most compelling candidate-facing elements from a job opportunity and present them as benefit statements — not features.

CORE FRAMEWORK:
Job ads are NOT job descriptions. A job description tells candidates what the employer wants. A job ad tells candidates what THEY get. Every element must answer: "What's in it for the candidate?"

The three primary levers that move healthcare candidates to apply:
1. MONETARY OPPORTUNITY — beyond base pay: overtime, temp-to-perm, bonuses, weekly pay
2. SHIFT OPPORTUNITY — not just the shift times, but what those hours mean for their life
3. AFFORDABLE HEALTHCARE — specific dollar amounts, not vague "competitive benefits"

For healthcare roles, a fourth lever applies:
4. PURPOSE/MISSION — the impact they'll have on real patients

RAW JOB DESCRIPTION:
${jobAd.raw_job_description}

MONETARY DETAILS PROVIDED:
${monetaryContext}

SHIFT DETAILS PROVIDED:
${shiftContext}

HEALTHCARE BENEFITS:
${benefits || 'Not specified — omit this section'}

PURPOSE/MISSION CONTEXT:
${purposeContext || 'No specific mission context provided'}

YOUR TASK:
Extract 6–10 individual compelling elements from all the above. Each element should be a short, punchy candidate-facing benefit statement — written as if you're telling a candidate what they get, not what the employer needs.

Return ONLY a JSON array. Each object must have:
- "id": a unique string (e.g. "el_1", "el_2")
- "category": one of "monetary", "shift", "benefits", "purpose", "requirement"
- "text": the benefit statement (1–2 sentences max, candidate-facing, specific)
- "selected": true

SHIFT TRANSLATION GUIDE — use these translations:
- M-F 7am-3pm or similar → "Set schedule with weekends off"
- M-F any standard hours → "Monday through Friday schedule — weekends are yours"
- 4 × 10-hour shifts → "Full paycheck with a 3-day weekend every week"
- 5 × 10s or 5 × 12s → "Maximum overtime every week — serious earning potential"
- Night shift → "Day shift hours back — work nights, keep your days free"
- 3 × 12-hour shifts (nursing) → "Three shifts, full-time pay — four days off every week"
- PRN/Per diem → "Pick your own schedule — work when it fits your life"

MONETARY TRANSLATION GUIDE:
- Always lead with the top dollar figure
- Temp-to-perm = path to a permanent job, not just a temp gig
- Overtime = earning potential, not a requirement
- Bonuses = real extra money, not just "incentives"

Respond with ONLY the JSON array, no other text.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
  }

  let elements
  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    elements = JSON.parse(jsonMatch ? jsonMatch[0] : content.text)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  await supabase
    .from('job_ads')
    .update({
      extracted_elements: elements,
      shift_translation: shiftContext,
      status: 'reviewing',
    })
    .eq('id', jobAdId)

  return NextResponse.json({ elements })
}

function buildMonetaryContext(jobAd: Record<string, unknown>): string {
  const parts = []
  if (jobAd.pay_rate) parts.push(`Pay rate: ${jobAd.pay_rate}`)
  if (jobAd.weekly_pay) parts.push('Weekly pay')
  if (jobAd.temp_to_perm) {
    parts.push(`Temp-to-perm opportunity${jobAd.temp_to_perm_details ? ': ' + jobAd.temp_to_perm_details : ''}`)
  }
  if (jobAd.overtime_opportunity) parts.push(`Overtime: ${jobAd.overtime_opportunity}`)
  if (jobAd.bonus_details) parts.push(`Bonuses: ${jobAd.bonus_details}`)
  return parts.join('\n') || 'No monetary details provided'
}

function buildShiftContext(shiftRaw: string): string {
  return shiftRaw || 'No shift details provided'
}

function buildPurposeContext(jobAd: Record<string, unknown>): string {
  const parts = []
  if (jobAd.facility_type) parts.push(`Facility: ${jobAd.facility_type}`)
  if (Array.isArray(jobAd.patient_population) && jobAd.patient_population.length > 0) {
    parts.push(`Patient population: ${(jobAd.patient_population as string[]).join(', ')}`)
  }
  if (Array.isArray(jobAd.specialty) && jobAd.specialty.length > 0) {
    parts.push(`Specialty: ${(jobAd.specialty as string[]).join(', ')}`)
  }
  if (jobAd.purpose_other) parts.push(`Additional context: ${jobAd.purpose_other}`)
  return parts.join('\n')
}
