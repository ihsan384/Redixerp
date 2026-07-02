import { useState, useEffect } from 'react'
import { Plus, MessageSquare, StickyNote, Calendar, PhoneCall, Trash2, CalendarClock, User } from 'lucide-react'
import type { Client, ClientNote, ClientNoteCategory } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

interface NotesTabProps {
  client: Client
}

const CATEGORIES: { value: ClientNoteCategory; label: string; icon: any; color: string; border: string; bg: string }[] = [
  { value: 'internal', label: 'Internal Notes', icon: StickyNote, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
  { value: 'client', label: 'Client Notes', icon: MessageSquare, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
  { value: 'meeting', label: 'Meeting Summary', icon: Calendar, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
  { value: 'call', label: 'Call Log history', icon: PhoneCall, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' }
]

export function NotesTab({ client }: NotesTabProps) {
  const { employee } = useAuth()
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [loading, setLoading] = useState(true)
  const [addingNote, setAddingNote] = useState(false)

  // Form states
  const [category, setCategory] = useState<ClientNoteCategory>('internal')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const loadNotes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setNotes((data || []) as ClientNote[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
    setAddingNote(false)
  }, [client.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      toast.error('Title and content are required')
      return
    }

    try {
      const newNote = {
        client_id: client.id,
        category,
        title,
        content,
        created_by: employee?.name || 'Manager',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase.from('client_notes').insert(newNote as never)
      if (error) throw error

      // Log activity
      const activityPayload = {
        lead_id: client.id,
        type: 'note',
        description: `Added ${category} note: "${title}".`
      }
      await supabase.from('activities').insert(activityPayload as never)

      toast.success('Note added successfully')
      setTitle('')
      setContent('')
      setAddingNote(false)
      loadNotes()
    } catch (e) {
      console.error(e)
      toast.error('Failed to save note')
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('client_notes').delete().eq('id', id)
      if (error) throw error
      toast.success('Note deleted')
      loadNotes()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete note')
    }
  }

  const getCategoryConfig = (cat: ClientNoteCategory) => {
    return CATEGORIES.find(c => c.value === cat) || CATEGORIES[0]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List notes */}
      <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
        <div className="panel-card p-5 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Client Notes & Meetings Log</h3>
            {!addingNote && (
              <button
                onClick={() => setAddingNote(true)}
                className="btn-primary h-8 px-3 text-[11px] font-bold rounded-lg gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Add Log</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-6 h-6 border-2 border-red-500/20 border-t-red-500 animate-spin rounded-full" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center py-10 text-zinc-500 text-xs italic font-semibold">No notes or call history registered.</p>
          ) : (
            <div className="space-y-4.5">
              {notes.map(note => {
                const config = getCategoryConfig(note.category)
                const Icon = config.icon
                return (
                  <div key={note.id} className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-4.5 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${config.border} ${config.bg} ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">{note.title}</p>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                            <span>{config.label}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {note.created_by || 'Staff'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(note.created_at).toLocaleDateString('en-PK')}
                        </span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap pl-1">{note.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor sidebar / form */}
      <div className="order-1 lg:order-2 space-y-4">
        {(addingNote || notes.length === 0) ? (
          <form onSubmit={handleSubmit} className="panel-card p-5 bg-[#111]/40 border border-white/[0.06] backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.04] pb-2">Record New Log / Call</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Log Classification</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`h-9 text-[10px] font-bold border rounded-lg transition-all duration-200 ${
                      category === cat.value
                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                        : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Title / Topic</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Discovery meeting, billing call"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Detailed Logs Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Summary of details discussed, action items..."
                className="w-full h-32 text-xs py-2"
                required
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-white/[0.04]">
              <button
                type="submit"
                className="btn-primary flex-1 h-10 text-xs font-bold rounded-xl"
              >
                Save Log
              </button>
              {notes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddingNote(false)}
                  className="btn-secondary h-10 px-4 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="panel-card p-5 bg-gradient-to-br from-red-950/5 to-zinc-900/10 border border-white/[0.06] text-center space-y-3.5 py-7">
            <StickyNote className="w-10 h-10 text-red-500/30 mx-auto" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Strategic Knowledge logs</p>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1 leading-relaxed">Log client conversations, internal instructions, meeting minutes, and call history logs safely.</p>
            </div>
            <button
              onClick={() => setAddingNote(true)}
              className="btn-primary w-full h-10 text-xs font-bold rounded-xl"
            >
              Add New Note / Log
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
