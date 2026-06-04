import { z } from 'zod'

export const farmerStep1Schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  primary_phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  village: z.string().min(1, 'Village is required'),
  district: z.string().min(1, 'District is required'),
})

export const farmerStep2Schema = z.object({
  father_or_husband_name: z.string().optional(),
  alternate_phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
  whatsapp_number: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  date_of_birth: z.string().optional(),
})

export const farmerStep3Schema = z.object({
  tehsil: z.string().optional(),
  state: z.string().default('Rajasthan'),
  pin_code: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
})

export const farmerStep4Schema = z.object({
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().or(z.literal('')),
  bank_name: z.string().optional(),
  aadhar_number: z.string().regex(/^\d{4}$/, 'Enter last 4 digits only').optional().or(z.literal('')),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().or(z.literal('')),
})

export const farmerStep5Schema = z.object({
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  agreement_start_date: z.string().optional(),
  agreement_end_date: z.string().optional(),
})

export type FarmerStep1 = z.infer<typeof farmerStep1Schema>
export type FarmerStep2 = z.infer<typeof farmerStep2Schema>
export type FarmerStep3 = z.infer<typeof farmerStep3Schema>
export type FarmerStep4 = z.infer<typeof farmerStep4Schema>
export type FarmerStep5 = z.infer<typeof farmerStep5Schema>
