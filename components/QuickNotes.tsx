'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase, QuickNote } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const COLORS = ['#fff9db', '#dbeafe', '#dcfce7', '#fce7f3', '#f3e8ff']

export default function QuickNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [draft, setDraft] = useState('')
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    if (user) loadNotes()
  }, [user])

  async function loadNotes() {
    const { data } = await supabase
      .from('quick_notes')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(6)
    if (data) setNotes(data)
  }

  async function addNote() {
    if (!draft.trim() || !user) return
    const { data } = await supabase
      .from('quick_notes')
      .insert({ user_id: user.id, content: draft.trim(), color })
      .select()
      .single()
    if (data) setNotes([data, ...notes])
    setDraft('')
  }

  async function deleteNote(id: string) {
    await supabase.from('quick_notes').delete().eq('id', id)
    setNotes(notes.filter((n) => n.id !== id))
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-surface-900 mb-3">📝 Notas rápidas</h2>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
          placeholder="Escribe una nota..."
          className="flex-1 px-3 py-2 text-sm rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-accent scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={addNote}
          className="p-2 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all shadow-sm"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Notes grid */}
      <div className="grid grid-cols-2 gap-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group relative p-3 rounded-xl text-sm text-surface-800 transition-all"
            style={{ backgroundColor: note.color }}
          >
            <p className="text-xs leading-relaxed break-words pr-4">{note.content}</p>
            <button
              onClick={() => deleteNote(note.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-surface-800/40 hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="col-span-2 text-xs text-surface-800/30 text-center py-4">
            No hay notas aún
          </div>
        )}
      </div>
    </div>
  )
}
