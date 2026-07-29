import { useState, useEffect } from 'react'
import { FileText, Search, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Quote } from '@/types/database.types'

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
      setQuotes(data || [])
    } catch (err) {
      console.error('Fetch quotes error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  const handleUpdateStatus = async (quoteId: string, status: string) => {
    setQuotes(quotes.map((q) => (q.id === quoteId ? { ...q, status } : q)))
    await supabase.from('quotes').update({ status }).eq('id', quoteId)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#090909] text-white p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Quotes & Proposals</h1>
          </div>
          <p className="text-xs text-zinc-400">Review quote requests from REDIX.MEDIA and track proposals.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchQuotes} className="icon-btn h-10 w-10 rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">Loading quotes...</div>
      ) : quotes.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.02]">
          No quotes found. Quote requests submitted on REDIX.MEDIA will land here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <div key={q.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-400">{q.quote_number || 'QUOTE'}</span>
                <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                  {q.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-white">{q.name}</h3>
                <p className="text-xs text-zinc-400">{q.email}</p>
              </div>

              <div className="border-t border-white/5 pt-2 space-y-1 text-xs text-zinc-300">
                <p><span className="text-zinc-500">Service:</span> {q.service || 'N/A'}</p>
                <p><span className="text-zinc-500">Budget:</span> {q.budget_range || 'N/A'}</p>
                {q.details && <p className="text-zinc-400 line-clamp-2 mt-1">{q.details}</p>}
              </div>

              <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs">
                <select
                  value={q.status}
                  onChange={(e) => handleUpdateStatus(q.id, e.target.value)}
                  className="rounded bg-black/40 border border-white/10 px-2 py-1 text-xs text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <span className="text-[10px] text-zinc-500">{new Date(q.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
