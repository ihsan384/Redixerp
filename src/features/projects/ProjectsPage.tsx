import { useState, useEffect } from 'react'
import { Briefcase, Search, Plus, Calendar, DollarSign, RefreshCw, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Project, Client } from '@/types/database.types'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // New Project Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [budget, setBudget] = useState('')
  const [status, setStatus] = useState('in_progress')
  const [description, setDescription] = useState('')

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const { data: projData } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      const { data: clientData } = await supabase.from('clients').select('*')
      setProjects(projData || [])
      setClients(clientData || [])
    } catch (err) {
      console.error('Fetch projects error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async () => {
    if (!title || !clientId) {
      alert('Title and Client are required.')
      return
    }

    try {
      await supabase.from('projects').insert({
        title,
        client_id: clientId,
        budget: parseFloat(budget) || 0,
        status,
        description,
      })

      setModalOpen(false)
      setTitle('')
      setBudget('')
      setDescription('')
      fetchProjects()
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#090909] text-white p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Client Projects</h1>
          </div>
          <p className="text-xs text-zinc-400">Track client project deliverables, budgets, and execution stages.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Project</span>
          </button>
          <button onClick={fetchProjects} className="icon-btn h-10 w-10 rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 rounded-2xl border border-white/5 bg-white/[0.02]">
          No active projects found. Click "Create New Project" to add one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const client = clients.find((c) => c.id === p.client_id)
            return (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">{p.title}</h3>
                    <p className="text-xs text-zinc-400">{client?.name || 'Client'}</p>
                  </div>
                  <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                {p.description && <p className="text-xs text-zinc-300 line-clamp-2">{p.description}</p>}

                <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span>Budget: ₹{p.budget?.toLocaleString() || 0}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-6 space-y-4 text-xs">
            <h2 className="text-lg font-bold text-white">Create New Project</h2>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next.js Website & ERP Sync"
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company || c.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Budget (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="25000"
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 font-semibold hover:bg-white/20">
                Cancel
              </button>
              <button onClick={handleCreateProject} className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400">
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
