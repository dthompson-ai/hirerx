import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ExtractedElement } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobAdId, elements, jobTitle } = await request.json()

  const { data: jobAd } = await supabase
    .from('job_ads')
    .select('*')
    .eq('id', jobAdId)
    .eq('user_id', user.id)
    .single()

  if (!jobAd) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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

RAW JOB DESCRIPTION (for What You\'ll Do and Requirements sections):
${jobAd.raw_job_description}

ASSEMBLY RULES:
1. OPPORTUNITY STATEMENT: Exactly 2 sentences. No more, no fewer. Sentence 1 leads with the strongest benefit (pay + shift, or pay + purpose for healthcare roles) — make it specific and dollar-anchored when possible. Sentence 2 closes with what makes this opportunity worth not ignoring. Must feel like you're talking TO the candidate, not AT them. No corporate speak. These two sentences are also the exact right length for an SMS message — write them that way.

2. HIGHLIGHT REEL: 5–7 bullet points. Each one is a specific, concrete benefit. Lead with the dollar figure if pay is compelling. Include shift translation (e.g. "M-F schedule — weekends off" not just "first shift"). Include temp-to-perm if applicable. Include healthcare if specific dollar amounts are available.

3. WHAT YOU'LL DO AS A ${jobTitle.toUpperCase()}: 5–7 bullets extracted from the job description. Use "you will" or action verbs. Keep it specific to the role, not generic. The section header must be exactly: "What you'll do as a ${jobTitle}"

4. REQUIREMENTS: Frame softly. Start section with exactly this header and framing: "Preferred Candidate Might..." — never "Must have", "Required", or "Preferred candidates will have". List only the genuinely important ones (3–5 max). Leave the door open.

5. BENEFITS: If standard benefits provided, list them as bullet points under a "Benefits" header. If none provided, omit this section entirely.

6. CALL TO ACTION: End with exactly this line, nothing else after it:
Apply now.

FORMAT: Plain text only. No markdown, no asterisks, no bold markers. Use simple dashes (-) for bullets. Separate sections with a blank line. The output will be copied directly into Indeed or an ATS.

OUTPUT THE JOB AD NOW:`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

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
