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
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 mt-1">Operating Workspace</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[580px] space-y-6"
          >
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Enterprise Workspace v1.0</span>
            <h1 className="text-display tracking-tight text-white font-bold leading-none">
              Every lead, call, and payment—one clear system.
            </h1>
            <p className="text-caption text-zinc-400 font-medium leading-relaxed max-w-[500px]">
              Redix gives your team a focused command center for outbound pipelines, client lifecycles, and financial ledger summaries.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4.5">
                <Activity className="h-5 w-5 text-red-400" />
                <p className="mt-4 text-sm font-bold text-white tracking-tight">Real-Time Metrics</p>
                <p className="mt-1 text-xs text-zinc-500 font-semibold leading-relaxed">Pipeline conversion speeds and financial ledgers synced.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400 animate-pulse" />
                <p className="mt-4 text-sm font-bold text-white tracking-tight">Unified Access</p>
                <p className="mt-1 text-xs text-zinc-500 font-semibold leading-relaxed">Role-aware representative workflows with audit logs.</p>
              </div>
            </div>
          </motion.div>

          <p className="relative text-[11px] text-zinc-600 font-bold uppercase tracking-wider">© {new Date().getFullYear()} REDIX.MEDIA · SECURED WORKSPACE</p>
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

            <div className="space-y-2">
              <span className="eyebrow">Enterprise Access</span>
              <h2 className="text-[32px] font-bold tracking-tight text-white">Sign in to Redix</h2>
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Enter your credentials to continue to the dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-semibold text-zinc-300">Work Email Address</label>
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
                  <label htmlFor="password" className="text-[13px] font-semibold text-zinc-300">Password</label>
                  <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Protected Access</span>
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
                  <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                ) : (
                  <>
                    <span>Authenticate Account</span>
                    <ArrowRight className="h-4.5 w-4.5 shrink-0" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-bold tracking-wider pt-2 border-t border-white/[0.04]">
              <ShieldCheck className="h-4 w-4 text-zinc-600" /> Secure 256-bit encrypted gateway session
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
