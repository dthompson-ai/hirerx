export type SubscriptionStatus = 'active' | 'inactive' | 'gifted' | 'canceled'

export interface Profile {
  id: string
  email: string
  full_name: string
  agency_name: string
  standard_benefits: string
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export type JobAdStatus = 'intake' | 'reviewing' | 'complete'

export interface ExtractedElement {
  id: string
  category: 'monetary' | 'shift' | 'benefits' | 'purpose' | 'requirement'
  text: string
  selected: boolean
}

export interface JobAd {
  id: string
  user_id: string
  title: string
  status: JobAdStatus
  raw_job_description: string
  pay_rate: string
  temp_to_perm: boolean
  temp_to_perm_details: string
  overtime_opportunity: string
  bonus_details: string
  weekly_pay: boolean
  shift_raw: string
  shift_translation: string
  facility_type: string
  patient_population: string[]
  specialty: string[]
  purpose_other: string
  benefits_override: string
  extracted_elements: ExtractedElement[]
  final_output: string
  created_at: string
  updated_at: string
}
