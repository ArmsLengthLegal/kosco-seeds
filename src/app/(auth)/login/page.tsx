'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sprout, Loader2, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) setError(error.message)
    else { router.push('/dashboard'); router.refresh() }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      {/* Top brand band */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-700 shadow-lg shadow-brand-700/30">
              <Sprout className="h-11 w-11 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-brand-900">Kosco Seeds</h1>
            <p className="mt-1 text-lg text-muted-foreground">Field Inspection System</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border bg-white p-6 shadow-xl shadow-gray-200/60 sm:p-8">
            <h2 className="mb-1 text-2xl font-semibold text-gray-900">Welcome back</h2>
            <p className="mb-6 text-base text-muted-foreground">Sign in to continue</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-base font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
                  {...register('email')}
                />
                {errors.email && <p className="text-base text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-base font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 pr-14 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-600"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
                {errors.password && <p className="text-base text-destructive">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Sign In'}
              </button>

              <a href="/forgot-password" className="block py-1 text-center text-base font-medium text-brand-700 hover:underline">
                Forgot password?
              </a>
            </form>
          </div>
        </div>
      </div>

      <p className="pb-6 text-center text-sm text-muted-foreground">Kosco Seeds · Rajasthan, India</p>
    </div>
  )
}
