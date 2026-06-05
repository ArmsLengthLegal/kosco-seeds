'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-700 shadow-lg shadow-brand-700/30">
            <KeyRound className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-brand-900">Reset Password</h1>
          <p className="mt-1 text-lg text-muted-foreground">We&apos;ll email you a reset link</p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-xl shadow-gray-200/60 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-brand-600" />
              <p className="text-lg text-gray-700">Check your email for a reset link.</p>
              <a href="/login" className="flex items-center gap-2 text-base font-medium text-brand-700 hover:underline">
                <ArrowLeft className="h-5 w-5" /> Back to login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-base font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-14 w-full rounded-xl border-2 border-input bg-white px-4 text-lg outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
                />
              </div>
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-brand-700 text-lg font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:bg-brand-800 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Send Reset Link'}
              </button>
              <a href="/login" className="block py-1 text-center text-base font-medium text-brand-700 hover:underline">
                Back to login
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
