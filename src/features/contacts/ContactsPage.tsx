import { useState, useEffect } from 'react'
import { Search, UserCheck, Plus, Mail, Phone, Building, Briefcase, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types/database.types'

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
      setContacts(data || [])
    } catch (err) {
      console.error('Fetch contacts error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#090909] text-white p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Contacts Directory</h1>
          </div>
          <p className="text-xs text-zinc-400">Manage individual contacts associated with leads and active clients.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchContacts} className="icon-btn h-10 w-10 rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts by name, email, or company..."
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-400/50"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">Loading contacts...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.02]">
          No contacts found in directory.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{c.name}</h3>
                  <p className="text-xs text-zinc-400">{c.position || 'Contact'}</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-1.5 text-xs text-zinc-300">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{c.company}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
