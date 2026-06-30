import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/15 active:scale-[.97]',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants[variant], className)} {...props} />
  )
)
Button.displayName = 'Button'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} aria-label={label} title={label} className={cn('icon-btn', className)} {...props} />
  )
)
IconButton.displayName = 'IconButton'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('page-intro', className)}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div ref={ref} className={cn(interactive ? 'surface-card' : 'panel-card', className)} {...props} />
  )
)
Panel.displayName = 'Panel'

type MetricTone = 'brand' | 'success' | 'warning' | 'info' | 'neutral'

const metricTones: Record<MetricTone, string> = {
  brand: 'border-red-400/20 bg-red-500/10 text-red-300',
  success: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
  info: 'border-blue-400/20 bg-blue-500/10 text-blue-300',
  neutral: 'border-white/8 bg-white/[0.04] text-zinc-300',
}

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  detail?: React.ReactNode
  trend?: string
  tone?: MetricTone
  index?: number
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  detail,
  trend,
  tone = 'neutral',
  index = 0,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.045, 0.3), duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn('surface-card group min-h-[168px] flex flex-col justify-between', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-[14px] border', metricTones[tone])}>
          {icon}
        </div>
        {trend && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-500/8 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
            {trend} <ArrowUpRight className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="mt-6">
        <div className="metric-value count-up text-[28px] leading-none">{value}</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-zinc-300">{label}</p>
          {detail && <span className="text-[11px] text-zinc-600">{detail}</span>}
        </div>
      </div>
    </motion.div>
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-zinc-300">
          {label}
        </label>
        {hint && <span className="text-[11px] text-zinc-600">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-red-400">{error}</p>}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-zinc-400">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('section-header', className)}>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}
