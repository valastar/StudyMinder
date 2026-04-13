'use client'
import { useState, useEffect } from 'react'
import { Plus, Calendar, Trash2 } from 'lucide-react'
import { supabase, Event } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const ACCENT_COLORS = ['#5b4fff', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  if (days < 0) return 'Pasado'
  return `En ${days}d`
}

export default function UpcomingEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [selectedColor, setSelectedColor] = useState(ACCENT_COLORS[0])

  useEffect(() => {
    if (user) loadEvents()
  }, [user])

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user!.id)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(5)
    if (data) setEvents(data)
  }

  async function addEvent() {
    if (!title.trim() || !date || !user) return
    const { data } = await supabase
      .from('events')
      .insert({ user_id: user.id, title: title.trim(), event_date: date, color: selectedColor })
      .select()
      .single()
    if (data) setEvents([...events, data].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()))
    setTitle('')
    setDate('')
    setShowForm(false)
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(events.filter((e) => e.id !== id))
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
          <Calendar size={15} className="text-accent" /> Próximos eventos
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-accent hover:text-accent-dark font-medium flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-2 animate-fade-up">
          <input
            type="text"
            placeholder="Nombre del evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <div className="flex items-center gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${selectedColor === c ? 'border-surface-900 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onClick={addEvent}
              className="ml-auto px-3 py-1 bg-accent text-white text-xs rounded-lg hover:bg-accent-dark transition-all"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-all">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{ev.title}</p>
              <p className="text-[10px] text-surface-800/40">{formatDate(ev.event_date)}</p>
            </div>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: ev.color + '20', color: ev.color }}
            >
              {daysUntil(ev.event_date)}
            </span>
            <button
              onClick={() => deleteEvent(ev.id)}
              className="opacity-0 group-hover:opacity-100 text-surface-800/30 hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-xs text-surface-800/30 text-center py-4">No hay eventos próximos</p>
        )}
      </div>
    </div>
  )
}
