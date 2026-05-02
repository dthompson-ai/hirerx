import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ExtractedElement } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    console.error('[assemble] auth failed', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobAdId, elements, jobTitle } = await request.json()
  console.log('[assemble] request for job', jobAdId, 'user', user.id)

  const { data: jobAd, error: jobError } = await supabase
    .from('job_ads')
    .select('*')
    .eq('id', jobAdId)
    .eq('user_id', user.id)
    .single()

  if (!jobAd) {
    console.error('[assemble] job not found', jobAdId, jobError)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('standard_benefits, agency_name')
    .eq('id', user.id)
    .single()

  const selectedElements: ExtractedElement[] = elements.filter((el: ExtractedElement) => el.selected)
  const benefits = jobAd.benefits_override || profile?.standard_benefits || ''

  const monetary = selectedElements.filter(el => el.category === 'monetary').map(el => el.text)
  const shift = selectedElements.filter(el => el.category === 'shift').map(el => el.text)
  const benefitsEls = selectedElements.filter(el => el.category === 'benefits').map(el => el.text)
  const purpose = selectedElements.filter(el => el.category === 'purpose').map(el => el.text)
  const requirements = selectedElements.filter(el => el.category === 'requirement').map(el => el.text)

  const prompt = `You are an expert healthcare staffing recruiter copywriter. Assemble a complete, formatted job ad from the elements provided.

JOB TITLE: ${jobTitle}

SELECTED COMPELLING ELEMENTS:
Monetary: ${monetary.join(' | ') || 'none'}
Shift: ${shift.join(' | ') || 'none'}
Benefits/Healthcare: ${benefitsEls.join(' | ') || 'none'}
Purpose/Mission: ${purpose.join(' | ') || 'none'}
Requirements: ${requirements.join(' | ') || 'none'}

STANDARD BENEFITS PACKAGE:
${benefits || 'None provided'}

EMPLOYER DESCRIPTION (About Us — include verbatim if provided):
${jobAd.employer_description || 'None provided — omit About Us section'}

RAW JOB DESCRIPTION (for What You\'ll Do and Requirements sections):
${jobAd.raw_job_description}

ASSEMBLY RULES:
1. OPPORTUNITY STATEMENT: Exactly 2 sentences. No more, no fewer. Target ~65 characters per sentence — the full statement must fit in a standard SMS (160 chars) with room left over for a call to action like "Apply: [link]". Count characters mentally as you write. Sentence 1 leads with the strongest benefit (pay + shift, or pay + purpose for healthcare roles) — make it specific and dollar-anchored when possible. Sentence 2 closes with what makes this opportunity worth not ignoring. Must feel like you're talking TO the candidate, not AT them. No corporate speak.

2. HIGHLIGHT REEL: 5–7 bullet points. Each bullet is ONE piece of information — no compound bullets joining two ideas with "and". Keep each bullet short and punchy: specific, concrete, scannable at a glance. Lead with the dollar figure if pay is compelling. Translate shifts into life terms (e.g. "Three 12-hr shifts — four days off every week" not just "36 hrs/week"). Include temp-to-perm and healthcare specifics when available.

3. WHAT YOU'LL DO AS A ${jobTitle.toUpperCase()}: 5–7 bullets extracted from the job description. Each bullet is a single task or responsibility — short, action-verb-led, no run-ons. Keep it specific to the role. The section header must be exactly: "What you'll do as a ${jobTitle}"

4. REQUIREMENTS: Frame softly. Start section with exactly this header and framing: "Preferred Candidate Might..." — never "Must have", "Required", or "Preferred candidates will have". List only the genuinely important ones (3–5 max). One requirement per bullet — short and plainly stated. Leave the door open.

5. BENEFITS: If standard benefits provided, list them as clean bullet points under a "Benefits" header — one item per bullet, no elaboration needed. If none provided, omit this section entirely.

6. ABOUT US: If an employer description is provided, include it verbatim under an "About Us" header — do not rewrite, expand, or summarize it. If none provided, omit this section entirely.

7. CALL TO ACTION: End with exactly these two lines, nothing else after them:
If this sounds like something that interests you, we'd love to set up an appointment to speak with you. Apply now.

FORMAT: Plain text only. No markdown, no asterisks, no bold markers. Use simple dashes (-) for bullets. Separate sections with a blank line. The output will be copied directly into Indeed or an ATS.

OUTPUT THE JOB AD NOW:`

  console.log('[assemble] calling Anthropic for job', jobAdId)
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  console.log('[assemble] Anthropic responded')

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
  }

  const finalOutput = content.text.trim()

  await supabase
    .from('job_ads')
    .update({
      extracted_elements: elements,
      title: jobTitle,
      final_output: finalOutput,
      status: 'complete',
    })
    .eq('id', jobAdId)

  return NextResponse.json({ output: finalOutput })
}
