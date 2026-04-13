'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, FileText } from 'lucide-react'
import { supabase, Note } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export default function ApuntesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) loadNotes()
  }, [user])

  async function loadNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
    if (data) setNotes(data)
  }

  async function saveNote() {
    if (!title.trim() || !user) return
    if (selected) {
      await supabase.from('notes').update({ title, content }).eq('id', selected.id)
      setNotes(notes.map((n) => n.id === selected.id ? { ...n, title, content } : n))
    } else {
      const { data } = await supabase
        .from('notes')
        .insert({ user_id: user.id, title, content })
        .select()
        .single()
      if (data) setNotes([data, ...notes])
    }
    setCreating(false)
    setSelected(null)
    setTitle('')
    setContent('')
  }

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(notes.filter((n) => n.id !== id))
    if (selected?.id === id) { setSelected(null); setTitle(''); setContent('') }
  }

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-surface-900">Apuntes</h1>
          <p className="text-sm text-surface-800/50 mt-1">{notes.length} notas</p>
        </div>
        <button
          onClick={() => { setCreating(true); setSelected(null); setTitle(''); setContent('') }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-all shadow-sm"
        >
          <Plus size={16} /> Nueva nota
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lista */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
            <input
              type="text"
              placeholder="Buscar apuntes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((note) => (
              <div
                key={note.id}
                onClick={() => { setSelected(note); setTitle(note.title); setContent(note.content ?? ''); setCreating(true) }}
                className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                  selected?.id === note.id
                    ? 'bg-accent/5 border-accent/30'
                    : 'bg-white border-surface-100 hover:border-surface-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{note.title}</p>
                    <p className="text-[10px] text-surface-800/40 mt-0.5 line-clamp-1">{note.content}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                    className="opacity-0 group-hover:opacity-100 text-surface-800/30 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8">
                <FileText size={28} className="text-surface-800/20 mx-auto mb-2" />
                <p className="text-xs text-surface-800/30">Sin apuntes</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {creating ? (
            <div className="card h-full flex flex-col gap-3">
              <input
                type="text"
                placeholder="Título del apunte..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-0 py-1 text-lg font-display bg-transparent border-b border-surface-100 focus:outline-none focus:border-accent transition-all"
              />
              <textarea
                placeholder="Escribe tus apuntes aquí..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 min-h-[300px] w-full text-sm text-surface-800 bg-transparent resize-none focus:outline-none leading-relaxed"
              />
              <div className="flex gap-2 pt-2 border-t border-surface-100">
                <button
                  onClick={saveNote}
                  className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-xl hover:bg-accent-dark transition-all"
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setCreating(false); setSelected(null) }}
                  className="px-4 py-2 bg-surface-100 text-surface-800/60 text-xs font-medium rounded-xl hover:bg-surface-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center text-center">
              <FileText size={36} className="text-surface-800/15 mb-3" />
              <p className="text-sm text-surface-800/40">Selecciona o crea un apunte</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
