import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    const { error: authError } = await signIn(email, password)
    if (authError) setError(authError.message)
    setIsLoading(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="redix-grid absolute inset-0 opacity-35" />
      <div className="absolute -left-24 -top-32 h-[520px] w-[520px] rounded-full bg-red-500/15 blur-[130px]" />
      <div className="absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full bg-red-950/20 blur-[140px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-32px)] max-w-[1480px] overflow-hidden rounded-[24px] border border-white/[0.075] bg-[#0b0b0b]/76 shadow-[0_42px_130px_rgba(0,0,0,.62)] backdrop-blur-2xl sm:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] lg:grid-cols-[1.12fr_.88fr]">
        <section className="relative hidden overflow-hidden border-r border-white/[0.065] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(229,57,53,.12),transparent_45%)]" />
          <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-red-500/10 blur-[100px]" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-red-300/30 bg-gradient-to-br from-red-400 to-red-700 shadow-[0_14px_38px_rgba(229,57,53,.3)]">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-[-0.045em] text-white">REDIX</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-zinc-600">Business Operating System</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-[620px]"
          >
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Enterprise workspace</span>
            <h1 className="max-w-[560px] text-[48px] font-bold leading-[1.03] tracking-[-0.055em] text-white xl:text-[58px]">
              Every lead, call, and payment—one clear system.
            </h1>
            <p className="mt-6 max-w-[530px] text-[16px] leading-7 text-zinc-400">
              REDIX gives your team a focused command center for pipeline execution, client operations, and financial visibility.
            </p>

            <div className="mt-10 grid max-w-[560px] grid-cols-2 gap-3">
              <div className="rounded-[18px] border border-white/[0.075] bg-white/[0.03] p-4">
                <Activity className="h-5 w-5 text-red-300" />
                <p className="mt-5 text-sm font-bold text-white">Live operating view</p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">Pipeline, follow-ups, and finance in sync.</p>
              </div>
              <div className="rounded-[18px] border border-white/[0.075] bg-white/[0.03] p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="mt-5 text-sm font-bold text-white">Built for focused teams</p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">Role-aware workflows with reliable context.</p>
              </div>
            </div>
          </motion.div>

          <p className="relative text-[11px] text-zinc-700">© {new Date().getFullYear()} REDIX.MEDIA · Secure workspace</p>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10 xl:p-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px]"
          >
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-red-400 to-red-700">
                <Zap className="h-5 w-5 fill-white text-white" />
              </div>
              <p className="text-xl font-bold tracking-[-0.04em] text-white">REDIX</p>
            </div>

            <div>
              <span className="eyebrow">Welcome back</span>
              <h2 className="text-[34px] font-bold tracking-[-0.045em] text-white">Sign in to REDIX</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-500">Enter your work credentials to continue to the business workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-9 space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-semibold text-zinc-300">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@redix.media"
                  required
                  className="w-full px-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-semibold text-zinc-300">Password</label>
                  <span className="text-[11px] font-semibold text-zinc-600">Protected access</span>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-[14px] border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                  {error}
                </motion.p>
              )}

              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-2 text-xs text-zinc-700">
              <ShieldCheck className="h-4 w-4" /> Authenticated and encrypted session
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
