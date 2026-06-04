import { z } from 'zod'

export const inspectionSchema = z.object({
  assignment_id: z.string().uuid(),
  production_agreement_id: z.string().uuid(),
  inspection_date: z.string().min(1, 'Date is required'),
  inspection_time: z.string().optional(),
  gps_lat: z.number().optional(),
  gps_lng: z.number().optional(),
  gps_accuracy_meters: z.number().optional(),
  crop_stage: z.enum(['vegetative', 'tillering', 'flowering', 'grain-fill', 'maturity']),
  plant_stand: z.enum(['excellent', 'good', 'fair', 'poor']),
  plant_population_per_sqm: z.number().int().optional(),
  weed_infestation: z.enum(['nil', 'light', 'moderate', 'heavy']),
  pest_disease_status: z.enum(['nil', 'mild', 'moderate', 'severe']),
  pest_disease_details: z.string().optional(),
  isolation_distance_met: z.boolean(),
  isolation_distance_meters: z.number().optional(),
  off_type_plants_count: z.number().int().default(0),
  off_type_percentage: z.number().min(0).max(100).default(0),
  estimated_yield_quintals: z.number().optional(),
  yield_estimate_basis: z.string().optional(),
  overall_status: z.enum(['pass', 'conditional-pass', 'fail']),
  rejection_reason: z.string().optional(),
  recommendation: z.string().optional(),
  field_observations: z.string().optional(),
  action_required: z.string().optional(),
  follow_up_required: z.boolean().default(false),
  follow_up_notes: z.string().optional(),
}).refine(
  (data) => data.overall_status === 'pass' || !!data.rejection_reason,
  { message: 'Reason is required for conditional pass or fail', path: ['rejection_reason'] }
)

export type InspectionFormData = z.infer<typeof inspectionSchema>
