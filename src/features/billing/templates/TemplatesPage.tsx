import { useState } from 'react'
import { LayoutTemplate, Check, Palette, Type, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBillingStore } from '../hooks/useBillingStore'
import type { BillingTemplate, InvoiceTemplateStyle } from '@/types'
import { toast } from 'sonner'

const STYLE_PREVIEWS: Record<InvoiceTemplateStyle, { gradient: string; accent: string; textColor: string }> = {
  modern:       { gradient: 'from-red-600 to-red-800',    accent: '#e53935', textColor: 'text-white' },
  minimal:      { gradient: 'from-zinc-800 to-zinc-900',  accent: '#111111', textColor: 'text-zinc-200' },
  corporate:    { gradient: 'from-blue-700 to-blue-900',  accent: '#1e40af', textColor: 'text-white' },
  premium_dark: { gradient: 'from-amber-600 to-amber-800',accent: '#f59e0b', textColor: 'text-white' },
  agency:       { gradient: 'from-violet-700 to-violet-900',accent: '#7c3aed', textColor: 'text-white' },
}

function TemplateCard({ template, isSelected, onSelect }: { template: BillingTemplate; isSelected: boolean; onSelect: () => void }) {
  const preview = STYLE_PREVIEWS[template.style] || STYLE_PREVIEWS.modern
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/[0.08] hover:border-white/20'}`}
    >
      {/* Preview Header */}
      <div className={`bg-gradient-to-br ${preview.gradient} p-4 h-28 relative`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="h-2 w-20 bg-white/40 rounded-full mb-1.5" />
            <div className="h-1.5 w-12 bg-white/20 rounded-full" />
          </div>
          <div className="text-right">
            <div className="h-1.5 w-16 bg-white/30 rounded-full mb-1" />
            <div className="h-1.5 w-10 bg-white/20 rounded-full" />
          </div>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="h-1 w-full bg-white/10 rounded-full mb-1" />
          <div className="h-1 w-3/4 bg-white/10 rounded-full" />
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3 bg-[#161616]">
        <p className="font-bold text-white text-sm">{template.name}</p>
        <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{template.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: template.primary_color }} />
          <span className="text-xs text-zinc-500">{template.primary_color}</span>
          {template.is_custom && (
            <span className="ml-auto text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Custom</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function CustomTemplateModal({ onSave, onCancel }: {
  onSave: (data: Omit<BillingTemplate,'id'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState<InvoiceTemplateStyle>('modern')
  const [primaryColor, setPrimaryColor] = useState('#e53935')
  const [secondaryColor, setSecondaryColor] = useState('#1a1a1a')
  const [footerText, setFooterText] = useState('Thank you for your business!')

  const handleSave = () => {
    if (!name.trim()) { toast.error('Template name is required'); return }
    onSave({ name, description, style, primary_color: primaryColor, secondary_color: secondaryColor, font_family: 'helvetica', is_default: false, is_custom: true, footer_text: footerText })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onCancel} className="modal-backdrop fixed inset-0" />
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
        className="relative w-full max-w-md modal-panel p-6 space-y-4" style={{ zIndex:51 }}>
        <h3 className="text-h4 font-bold text-white">Create Custom Template</h3>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Template Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Agency Template" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">Base Style</label>
          <div className="grid grid-cols-3 gap-2">
            {(['modern','minimal','corporate','premium_dark','agency'] as InvoiceTemplateStyle[]).map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${style===s ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300'}`}>
                {s.replace('_',' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Primary Color</label>
            <div className="flex gap-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="!w-10 !h-10 !min-h-[40px] !p-1 !rounded-lg cursor-pointer" />
              <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 !h-10 !min-h-[40px]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Secondary Color</label>
            <div className="flex gap-2">
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="!w-10 !h-10 !min-h-[40px] !p-1 !rounded-lg cursor-pointer" />
              <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 !h-10 !min-h-[40px]" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Footer Text</label>
          <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Thank you for your business!" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="btn-ghost flex-1 h-10">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1 h-10">Save Template</button>
        </div>
      </motion.div>
    </div>
  )
}

export function TemplatesPage() {
  const { templates, saveTemplate, deleteTemplate } = useBillingStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSave = (data: Omit<BillingTemplate,'id'>) => {
    saveTemplate(data)
    toast.success('Custom template saved!')
    setShowForm(false)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Invoice Templates</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Choose a template style for your invoices and quotations</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Custom Template
          </button>
        </div>

        {/* Built-in Templates */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Built-in Templates</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {templates.filter(t => !t.is_custom).map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                isSelected={selectedId === tpl.id}
                onSelect={() => setSelectedId(tpl.id)}
              />
            ))}
          </div>
        </div>

        {/* Custom Templates */}
        {templates.filter(t => t.is_custom).length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Custom Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {templates.filter(t => t.is_custom).map(tpl => (
                <div key={tpl.id} className="relative group">
                  <TemplateCard
                    template={tpl}
                    isSelected={selectedId === tpl.id}
                    onSelect={() => setSelectedId(tpl.id)}
                  />
                  <button
                    onClick={() => { deleteTemplate(tpl.id); toast.success('Template deleted') }}
                    className="absolute top-2 left-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Template Info */}
        {selectedId && (() => {
          const t = templates.find(tpl => tpl.id === selectedId)
          if (!t) return null
          return (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className="surface-card flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: t.primary_color }}>
                <LayoutTemplate className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-sm text-zinc-500">{t.description}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> {t.primary_color}</div>
                <div className="flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> {t.font_family}</div>
              </div>
              <div className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
                <Check className="w-4 h-4" /> Selected
              </div>
            </motion.div>
          )
        })()}
      </div>

      <AnimatePresence>
        {showForm && <CustomTemplateModal onSave={handleSave} onCancel={() => setShowForm(false)} />}
      </AnimatePresence>
    </>
  )
}
