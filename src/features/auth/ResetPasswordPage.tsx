import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { KeyRound, ArrowRight, Zap, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    const { error: err } = await resetPassword(password)
    setIsLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      toast.success('Password updated successfully!')
      setTimeout(() => navigate('/'), 2000)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="redix-grid absolute inset-0 opacity-20" />
      <div className="absolute -left-24 -top-32 h-[520px] w-[520px] rounded-full bg-red-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full bg-red-950/15 blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px] rounded-[24px] border border-white/[0.08] bg-[#111111]/80 backdrop-blur-2xl shadow-[0_32px_96px_rgba(0,0,0,0.65)] p-8 sm:p-10 space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#e53935] to-[#c62828] shadow-[0_8px_20px_rgba(229,57,53,0.25)]">
            <Zap className="h-5 w-5 fill-white text-white" />
          </div>
          <p className="text-xl font-bold tracking-tight text-white leading-none">REDIX</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your password has been changed. Redirecting to dashboard…
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                <KeyRound className="w-3 h-3" /> Password Reset
              </div>
              <h2 className="text-[28px] font-bold tracking-tight text-white">Set New Password</h2>
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                Create a new secure password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-[13px] font-semibold text-zinc-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-[13px] font-semibold text-zinc-300">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs font-bold text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full h-11 text-xs font-bold rounded-xl mt-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-bold tracking-wider pt-2 border-t border-white/[0.04]">
          <ShieldCheck className="h-4 w-4 text-zinc-600" /> Secure password reset session
        </div>
      </motion.div>
    </main>
  )
}
