import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Phone, DollarSign, UserCheck, ArrowRight, CornerDownLeft } from 'lucide-react'
import { Storage } from '@/lib/storage'
import type { Lead, Employee } from '@/types'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [leads, setLeads] = useState<Lead[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    if (isOpen) {
      setLeads(Storage.getLeads())
      setEmployees(Storage.getEmployees())
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Handle Global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen) onClose()
      }
    };
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Filter Items
  const cleanQuery = query.trim().toLowerCase()

  const matchedLeads = cleanQuery
    ? leads.filter(
        (l) =>
          l.shop_name.toLowerCase().includes(cleanQuery) ||
          l.phone.includes(cleanQuery) ||
          l.category.toLowerCase().includes(cleanQuery) ||
          (l.website && l.website.toLowerCase().includes(cleanQuery))
      ).slice(0, 5)
    : []

  const matchedEmployees = cleanQuery
    ? employees.filter(
        (e) =>
          e.name.toLowerCase().includes(cleanQuery) ||
          e.email.toLowerCase().includes(cleanQuery) ||
          e.role.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : []

  // Quick navigation commands
  const navigationCommands = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', path: '/', category: 'Navigation', icon: ArrowRight },
    { id: 'nav-leads', label: 'Go to Leads Page', path: '/leads', category: 'Navigation', icon: ArrowRight },
    { id: 'nav-call-center', label: 'Go to Call Center', path: '/call-center', category: 'Navigation', icon: ArrowRight },
    { id: 'nav-follow-ups', label: 'Go to Follow Ups', path: '/follow-ups', category: 'Navigation', icon: ArrowRight },
    { id: 'nav-revenue', label: 'Go to Revenue Page', path: '/revenue', category: 'Navigation', icon: ArrowRight },
    { id: 'nav-expenses', label: 'Go to Expenses Page', path: '/expenses', category: 'Navigation', icon: ArrowRight },
    { id: 'nav-team', label: 'Go to Team Page', path: '/team', category: 'Navigation', icon: ArrowRight },
    { id: 'nav-reports', label: 'Go to Reports Page', path: '/reports', category: 'Navigation', icon: ArrowRight },
  ].filter((cmd) => cmd.label.toLowerCase().includes(cleanQuery))

  const results = [
    ...matchedLeads.map((l) => ({ id: `lead-${l.id}`, label: l.shop_name, sub: `${l.category} • ${l.phone}`, action: () => navigate(`/leads?search=${encodeURIComponent(l.phone)}`), icon: Users })),
    ...matchedEmployees.map((e) => ({ id: `emp-${e.id}`, label: e.name, sub: e.role.replace('_', ' '), action: () => navigate(`/team`), icon: UserCheck })),
    ...navigationCommands.map((c) => ({ id: c.id, label: c.label, sub: c.category, action: () => navigate(c.path), icon: c.icon })),
  ]

  // Keyboard navigation inside dialogue
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        results[selectedIndex].action()
        onClose()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="modal-panel z-10 mx-4 flex w-full max-w-2xl flex-col overflow-hidden"
          >
            {/* Search Input Area */}
            <div className="relative flex items-center px-4 border-b border-[#1f1f1f] h-14">
              <Search className="w-5 h-5 text-[#4b5563] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search anything (leads, phone, category, pages)..."
                className="w-full bg-transparent border-0 outline-none text-white text-sm placeholder-[#4b5563] ml-3 h-full pr-10"
              />
              <span className="absolute right-4 text-[10px] text-[#4b5563] border border-[#1f1f1f] bg-[#141414] px-1.5 py-0.5 rounded uppercase font-mono">
                esc
              </span>
            </div>

            {/* Results Body */}
            <div className="max-h-[360px] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#4b5563]">
                  {query ? 'No matching leads or sections found.' : 'Type something to search the CRM...'}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {results.map((item, idx) => {
                    const Icon = item.icon
                    const isSelected = idx === selectedIndex

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.action()
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                          isSelected ? 'bg-white/[0.06] text-white' : 'text-[#8c8c8c]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg border transition-colors ${
                            isSelected ? 'bg-white/10 border-white/10 text-white' : 'bg-[#141414] border-[#1f1f1f] text-[#636363]'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <p className="text-xs text-[#525252] mt-0.5">{item.sub}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] text-[#8c8c8c] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono">
                            <span>Select</span>
                            <CornerDownLeft className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111111]/50 border-t border-[#1f1f1f] text-[10px] text-[#4b5563]">
              <div className="flex gap-4">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
              </div>
              <div>REDIX.MEDIA CRM</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
