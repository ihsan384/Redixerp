import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox,
  Search,
  Filter,
  Mail,
  UserCheck,
  Send,
  UserPlus,
  Trash2,
  CheckCircle,
  Archive,
  RefreshCw,
  Clock,
  Sparkles,
  Tag,
  MessageSquare,
  MessageCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Message, Employee } from '@/types/database.types'

export function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: empData } = await supabase.from('employees').select('*')

      setMessages(msgData || [])
      setEmployees(empData || [])

      if (msgData && msgData.length > 0 && !selectedMessage) {
        setSelectedMessage(msgData[0])
      }
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()

    // Realtime channel for instant inbox updates
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchMessages()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdateStatus = async (messageId: string, status: 'unread' | 'read' | 'replied' | 'archived') => {
    const updated = messages.map((m) => (m.id === messageId ? { ...m, status } : m))
    setMessages(updated)
    if (selectedMessage?.id === messageId) {
      setSelectedMessage((prev) => (prev ? { ...prev, status } : null))
    }
    await supabase.from('messages').update({ status }).eq('id', messageId)
  }

  const handleAssignMember = async (messageId: string, assignedTo: string) => {
    const updated = messages.map((m) => (m.id === messageId ? { ...m, assigned_to: assignedTo } : m))
    setMessages(updated)
    if (selectedMessage?.id === messageId) {
      setSelectedMessage((prev) => (prev ? { ...prev, assigned_to: assignedTo } : null))
    }
    await supabase.from('messages').update({ assigned_to: assignedTo }).eq('id', messageId)
  }

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return
    setSendingReply(true)

    try {
      const newReply = {
        id: `rep-${Date.now()}`,
        sender_name: 'REDIX Support Team',
        sender_email: 'hello@redix.media',
        content: replyText.trim(),
        created_at: new Date().toISOString(),
      }

      const existingHistory = selectedMessage.reply_history || []
      const updatedHistory = [...existingHistory, newReply]

      await supabase
        .from('messages')
        .update({
          reply_history: updatedHistory,
          status: 'replied',
        })
        .eq('id', selectedMessage.id)

      setSelectedMessage({
        ...selectedMessage,
        reply_history: updatedHistory,
        status: 'replied',
      })
      setReplyText('')
      fetchMessages()
    } catch (err) {
      console.error('Failed to send reply:', err)
    } finally {
      setSendingReply(false)
    }
  }

  const handleConvertLeadToClient = async (msg: Message) => {
    try {
      // 1. Create client entry
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .insert({
          name: msg.name,
          email: msg.email,
          phone: msg.phone || '',
          company: msg.name + ' Org',
          status: 'active',
        })
        .select('id')
        .single()

      if (clientErr) throw clientErr

      // 2. Link message to client
      await supabase
        .from('messages')
        .update({ client_id: clientData.id })
        .eq('id', msg.id)

      // 3. Create notification
      await supabase.from('notifications').insert({
        title: 'Lead Converted to Client',
        message: `${msg.name} (${msg.email}) is now registered as an active Client.`,
        type: 'lead',
        reference_id: clientData.id,
        read: false,
      })

      alert(`Successfully converted "${msg.name}" into an Active Client!`)
      fetchMessages()
    } catch (err: any) {
      alert(`Conversion error: ${err.message}`)
    }
  }

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    const matchesType = typeFilter === 'all' || m.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-[#090909] text-white">
      {/* Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">REDIX.MEDIA Central Inbox</h1>
            <p className="text-xs text-zinc-400">Manage real-time inquiries, quotes, applications, and client replies.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMessages}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Inbox</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left List (35%), Right Reader (65%) */}
      <div className="flex min-h-0 flex-1 divide-x divide-white/[0.08]">
        {/* Left Inbox List */}
        <div className="flex w-full flex-col md:w-[380px] lg:w-[420px] shrink-0">
          {/* Filters & Search */}
          <div className="p-4 space-y-3 border-b border-white/[0.08]">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages by name, email..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-400/50 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs">
              {(['all', 'unread', 'read', 'replied', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1.5 font-semibold capitalize transition ${
                    statusFilter === st
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading messages...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">No messages match filter.</div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg)
                      if (msg.status === 'unread') {
                        handleUpdateStatus(msg.id, 'read')
                      }
                    }}
                    className={`cursor-pointer p-4 transition ${
                      isSelected
                        ? 'bg-white/[0.08] border-l-4 border-red-500'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{msg.name}</span>
                        {msg.status === 'unread' && (
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                        {msg.type}
                      </span>
                      <p className="truncate text-xs font-semibold text-zinc-300">{msg.subject || 'Website Inquiry'}</p>
                    </div>

                    <p className="line-clamp-2 text-xs text-zinc-400">{msg.content}</p>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="capitalize text-zinc-400">Status: {msg.status}</span>
                      {msg.client_id && (
                        <span className="rounded bg-green-500/20 text-green-400 px-1.5 py-0.5 font-bold">Client Linked</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Reader & Detail Panel */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {selectedMessage ? (
            <div className="flex flex-col h-full p-6 space-y-6">
              {/* Message Toolbar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">{selectedMessage.name}</h2>
                    <span className="rounded-full bg-red-500/20 text-red-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                      {selectedMessage.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{selectedMessage.email} {selectedMessage.phone ? `· ${selectedMessage.phone}` : ''}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConvertLeadToClient(selectedMessage)}
                    className="btn-primary px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    title="Convert this website contact to Client record"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>1-Click Convert to Client</span>
                  </button>

                  <select
                    value={selectedMessage.assigned_to || ''}
                    onChange={(e) => handleAssignMember(selectedMessage.id, e.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">Assign Team Member</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                    className="icon-btn h-9 w-9 rounded-xl text-zinc-400 hover:text-white"
                    title="Archive Message"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Message Content Box */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-bold text-white text-sm">{selectedMessage.subject || 'Inquiry Details'}</span>
                  <span>Received: {new Date(selectedMessage.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line border-t border-white/5 pt-4">
                  {selectedMessage.content}
                </div>

                {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs">
                    <p className="font-bold text-zinc-400 uppercase tracking-wider mb-2">Form Metadata</p>
                    <pre className="bg-black/50 p-3 rounded-xl border border-white/5 text-zinc-300 overflow-x-auto">
                      {JSON.stringify(selectedMessage.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Threaded Reply History Log */}
              {selectedMessage.reply_history && selectedMessage.reply_history.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reply History Thread</h3>
                  {selectedMessage.reply_history.map((rep) => (
                    <div key={rep.id} className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-bold text-red-300">{rep.sender_name}</span>
                        <span>{new Date(rep.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-zinc-200">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Box */}
              <div className="mt-auto space-y-3 border-t border-white/[0.08] pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Send Response to Client</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white placeholder-zinc-500 focus:border-red-400 focus:outline-none resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-500 text-xs">
              Select a message from the left to view details and manage response.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
