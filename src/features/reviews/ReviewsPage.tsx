import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  EyeOff,
  Sparkles,
  Link,
  Copy,
  Check,
  User,
  Building,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ClientReview, Client, ReviewRequest } from '@/types/database.types'

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ClientReview[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'hidden' | 'all'>('pending')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Generate Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [customClientName, setCustomClientName] = useState('')
  const [customClientEmail, setCustomClientEmail] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)

  // Edit Review Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<ClientReview | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data: revData } = await supabase
        .from('client_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')

      setReviews(revData || [])
      setClients(clientData || [])
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()

    const channel = supabase
      .channel('realtime:reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_reviews' }, () => fetchReviews())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdateStatus = async (reviewId: string, status: 'pending' | 'approved' | 'rejected' | 'hidden') => {
    const updated = reviews.map((r) => (r.id === reviewId ? { ...r, status } : r))
    setReviews(updated)
    await supabase.from('client_reviews').update({ status }).eq('id', reviewId)
  }

  const handleToggleFeatured = async (review: ClientReview) => {
    const featured = !review.featured
    const updated = reviews.map((r) => (r.id === review.id ? { ...r, featured } : r))
    setReviews(updated)
    await supabase.from('client_reviews').update({ featured }).eq('id', review.id)
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    setReviews(reviews.filter((r) => r.id !== reviewId))
    await supabase.from('client_reviews').delete().eq('id', reviewId)
  }

  const handleGenerateInviteToken = async () => {
    setGeneratingLink(true)
    try {
      let clientName = customClientName
      let clientEmail = customClientEmail
      let clientId = selectedClient || null

      if (selectedClient) {
        const found = clients.find((c) => c.id === selectedClient)
        if (found) {
          clientName = found.name
          clientEmail = found.email
        }
      }

      if (!clientName || !clientEmail) {
        alert('Client Name and Email are required.')
        setGeneratingLink(false)
        return
      }

      const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      const { error } = await supabase.from('review_requests').insert({
        client_id: clientId,
        token,
        client_name: clientName,
        client_email: clientEmail,
        used: false,
      })

      if (error) throw error

      const link = `${window.location.origin}/review?token=${token}`
      setGeneratedLink(link)
    } catch (err: any) {
      alert(`Failed to generate token: ${err.message}`)
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleSaveEditedReview = async () => {
    if (!editingReview) return
    await supabase
      .from('client_reviews')
      .update({
        name: editingReview.name,
        company: editingReview.company,
        position: editingReview.position,
        service: editingReview.service,
        rating: editingReview.rating,
        review: editingReview.review,
      })
      .eq('id', editingReview.id)

    setEditModalOpen(false)
    fetchReviews()
  }

  const filteredReviews = reviews.filter((r) => (activeTab === 'all' ? true : r.status === activeTab))

  return (
    <div className="flex min-h-screen flex-col bg-[#090909] text-white p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Client Review Moderation</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Moderate submitted client reviews, edit testimonials, and generate token-verified review invitation links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="btn-primary px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            <span>Generate Review Invite Token</span>
          </button>

          <button
            onClick={fetchReviews}
            className="icon-btn h-10 w-10 rounded-xl"
            title="Refresh Reviews"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs">
        {(['pending', 'approved', 'rejected', 'hidden', 'all'] as const).map((tab) => {
          const count = reviews.filter((r) => (tab === 'all' ? true : r.status === tab)).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 font-bold capitalize transition flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-amber-400 text-black'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Reviews Table / Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">Loading client reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.02]">
          No reviews found in status "{activeTab}".
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                rev.status === 'approved'
                  ? 'border-green-500/30 bg-green-950/10'
                  : rev.status === 'pending'
                  ? 'border-amber-500/30 bg-amber-950/10'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.featured && (
                      <span className="rounded bg-amber-400/20 text-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                        Featured
                      </span>
                    )}
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        rev.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : rev.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 line-clamp-4 leading-relaxed mb-4 italic">
                  "{rev.review}"
                </p>

                <div className="border-t border-white/10 pt-3 text-xs space-y-1">
                  <p className="font-bold text-white">{rev.name}</p>
                  <p className="text-zinc-400 text-[11px]">{rev.position ? `${rev.position}, ` : ''}{rev.company || 'Client'}</p>
                  <p className="text-[10px] text-zinc-500">Service: {rev.service || 'N/A'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-white/10 pt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateStatus(rev.id, 'approved')}
                    className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold flex items-center gap-1"
                    title="Approve Review"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold flex items-center gap-1"
                    title="Reject Review"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleFeatured(rev)}
                    className={`p-1.5 rounded-lg text-xs font-bold ${rev.featured ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-400'}`}
                    title="Toggle Featured Status"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingReview(rev)
                      setEditModalOpen(true)
                    }}
                    className="p-1.5 rounded-lg bg-white/10 text-zinc-300 hover:bg-white/20"
                    title="Edit Review Content"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    title="Delete Review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Link className="h-5 w-5 text-amber-400" />
              <span>Generate Token-Verified Review Link</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Select Existing Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
                >
                  <option value="">-- Choose Client or Enter Below --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || c.email})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedClient && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Client Name</label>
                    <input
                      type="text"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      placeholder="e.g. Athira Suresh"
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Client Email</label>
                    <input
                      type="email"
                      value={customClientEmail}
                      onChange={(e) => setCustomClientEmail(e.target.value)}
                      placeholder="athira@bloom.com"
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateInviteToken}
                disabled={generatingLink}
                className="w-full btn-primary py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <span>{generatingLink ? 'Generating...' : 'Generate Signed Invitation Token'}</span>
              </button>

              {generatedLink && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
                  <p className="font-bold text-amber-300">Shareable Review Link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-black/60 border border-white/10 p-2 rounded text-[11px] text-white font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink)
                        setCopiedToken('copied')
                        setTimeout(() => setCopiedToken(null), 2000)
                      }}
                      className="p-2 rounded bg-amber-400 text-black font-bold text-xs"
                    >
                      {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setInviteModalOpen(false)
                  setGeneratedLink('')
                }}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editModalOpen && editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-6 space-y-4 text-xs">
            <h2 className="text-lg font-bold text-white">Edit Client Review</h2>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Client Name</label>
              <input
                type="text"
                value={editingReview.name}
                onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Company</label>
                <input
                  type="text"
                  value={editingReview.company || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, company: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Position</label>
                <input
                  type="text"
                  value={editingReview.position || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, position: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Review Text</label>
              <textarea
                rows={4}
                value={editingReview.review}
                onChange={(e) => setEditingReview({ ...editingReview, review: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedReview}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
