'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Sprout, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const signupSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setError(null)
    const supabase = createClient()
    // SECURITY: role is NOT sent from the client. New accounts are created as
    // 'viewer' by the DB trigger; an administrator elevates roles afterwards.
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-5 py-10">
        <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-xl shadow-gray-200/60 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-brand-600" />
          <h2 className="text-2xl font-bold text-gray-900">Check your email!</h2>
          <p className="mt-2 text-lg text-muted-foreground">We sent a confirmation link to your email. Click it to activate your account.</p>
          <a href="/login" className="mt-6 block text-base font-medium text-brand-700 hover:underline">Back to login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-700 shadow-lg shadow-brand-700/30">
              <Sprout className="h-11 w-11 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-brand-900">Create Account</h1>
            <p className="mt-1 text-lg text-muted-foreground">Kosco Seeds Field Inspection</p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-xl shadow-gray-200/60 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Full name */}
              <div className="space-y-2">
                <label className="text-base font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
                  {...register('full_name')}
                />
                {errors.full_name && <p className="text-base text-destructive">{errors.full_name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-base font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
                  {...register('email')}
                />
                {errors.email && <p className="text-base text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-base font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 pr-14 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
                    {...register('password')}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
                {errors.password && <p className="text-base text-destructive">{errors.password.message}</p>}
              </div>

              {/* Role note — roles are assigned by an administrator, not self-selected */}
              <div className="rounded-xl bg-brand-50 px-4 py-3 text-base text-brand-800">
                New accounts start with <strong>view-only</strong> access. An administrator
                will grant your role (inspector, manager, etc.) after you sign up.
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Create Account'}
              </button>

              <a href="/login" className="block py-1 text-center text-base font-medium text-brand-700 hover:underline">
                Already have an account? Sign in
              </a>
            </form>
          </div>
        </div>
      </div>
      <p className="pb-6 text-center text-sm text-muted-foreground">Kosco Seeds · Rajasthan, India</p>
    </div>
  )
}
