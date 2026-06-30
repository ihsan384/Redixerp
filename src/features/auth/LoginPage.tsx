import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Zap, Mail, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

export function LoginPage() {
  const { signIn, forgotPassword, employee, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Forgot password
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  // If already logged in, redirect
  if (employee && !authLoading) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    const { error: authError } = await signIn(email, password)
    if (authError) {
      setError(authError.message)
    }
    setIsLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    const { error: err } = await forgotPassword(forgotEmail)
    setForgotLoading(false)
    if (err) {
      toast.error(err.message)
    } else {
      setForgotSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="redix-grid absolute inset-0 opacity-20" />
      <div className="absolute -left-24 -top-32 h-[520px] w-[520px] rounded-full bg-red-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full bg-red-950/15 blur-[140px] pointer-events-none" />

      <div className="relative mx-auto grid min-h-[calc(100vh-32px)] max-w-[1400px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111111]/75 shadow-[0_32px_96px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] lg:grid-cols-[1.1fr_.9fr]">
        {/* Left branding section */}
        <section className="relative hidden overflow-hidden border-r border-white/[0.06] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(229,57,53,0.1),transparent_40%)] pointer-events-none" />
          <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-red-500/5 blur-[100px] pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-red-500/20 bg-gradient-to-br from-[#e53935] to-[#c62828] shadow-[0_8px_24px_rgba(229,57,53,0.25)]">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-white leading-none">REDIX</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 mt-1">
                Operating Workspace
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[580px] space-y-6"
          >
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> Enterprise Workspace v1.0
            </span>
            <h1 className="text-display tracking-tight text-white font-bold leading-none">
              Every lead, call, and payment—one clear system.
            </h1>
            <p className="text-caption text-zinc-400 font-medium leading-relaxed max-w-[500px]">
              Redix gives your team a focused command center for outbound pipelines, client lifecycles, and financial
              ledger summaries.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4.5">
                <Activity className="h-5 w-5 text-red-400" />
                <p className="mt-4 text-sm font-bold text-white tracking-tight">Real-Time Metrics</p>
                <p className="mt-1 text-xs text-zinc-500 font-semibold leading-relaxed">
                  Pipeline conversion speeds and financial ledgers synced.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400 animate-pulse" />
                <p className="mt-4 text-sm font-bold text-white tracking-tight">Unified Access</p>
                <p className="mt-1 text-xs text-zinc-500 font-semibold leading-relaxed">
                  Role-aware representative workflows with audit logs.
                </p>
              </div>
            </div>
          </motion.div>

          <p className="relative text-[11px] text-zinc-600 font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} REDIX.MEDIA · SECURED WORKSPACE
          </p>
        </section>

        {/* Right login form section */}
        <section className="flex items-center justify-center p-6 sm:p-12 xl:p-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[380px] space-y-8"
          >
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#e53935] to-[#c62828] shadow-[0_8px_20px_rgba(229,57,53,0.25)]">
                <Zap className="h-5 w-5 fill-white text-white" />
              </div>
              <p className="text-xl font-bold tracking-tight text-white leading-none">REDIX</p>
            </div>

            <AnimatePresence mode="wait">
              {showForgot ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="eyebrow">Account Recovery</span>
                    <h2 className="text-[32px] font-bold tracking-tight text-white">Reset Password</h2>
                    <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                      Enter your email address and we'll send a reset link.
                    </p>
                  </div>

                  {forgotSent ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                      <p className="text-sm font-bold text-white">Reset email sent!</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Check your inbox for <span className="font-bold text-white">{forgotEmail}</span> and click the reset link.
                      </p>
                      <button
                        onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail('') }}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors underline mt-2"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label htmlFor="forgot-email" className="text-[13px] font-semibold text-zinc-300">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                          <input
                            id="forgot-email"
                            type="email"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            placeholder="name@redix.media"
                            required
                            className="w-full pl-10"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn-primary w-full h-11 text-xs font-bold rounded-xl"
                      >
                        {forgotLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Send Reset Link</span>
                            <ArrowRight className="h-4 w-4 shrink-0" />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="w-full text-xs font-bold text-zinc-500 hover:text-white transition-colors text-center"
                      >
                        Back to Sign In
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="eyebrow">Enterprise Access</span>
                    <h2 className="text-[32px] font-bold tracking-tight text-white">Welcome Back</h2>
                    <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                      Enter your credentials to continue to the dashboard.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-[13px] font-semibold text-zinc-300">
                        Work Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@redix.media"
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-[13px] font-semibold text-zinc-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter account password"
                          required
                          className="w-full pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        rememberMe ? 'bg-red-500 border-red-500' : 'border-white/20 bg-white/[0.02]'
                      }`}>
                        {rememberMe && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="text-xs text-zinc-400 font-semibold group-hover:text-white transition-colors">Remember me</span>
                    </label>

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
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <>
                          <span>Authenticate Account</span>
                          <ArrowRight className="h-4.5 w-4.5 shrink-0" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-bold tracking-wider pt-2 border-t border-white/[0.04]">
              <ShieldCheck className="h-4 w-4 text-zinc-600" /> Secure 256-bit encrypted gateway session
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
