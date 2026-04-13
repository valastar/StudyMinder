'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { supabase, Event } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const COLORS = ['#5b4fff', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

export default function CalendarioPage() {
  const { user } = useAuth()
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState<Event[]>([])
  const [selected, setSelected] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    if (user) loadEvents()
  }, [user, current])

  async function loadEvents() {
    const start = new Date(current.getFullYear(), current.getMonth(), 1).toISOString()
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59).toISOString()
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user!.id)
      .gte('event_date', start)
      .lte('event_date', end)
    if (data) setEvents(data)
  }

  async function addEvent() {
    if (!title.trim() || !selected || !user) return
    const dateStr = `${selected.getFullYear()}-${String(selected.getMonth()+1).padStart(2,'0')}-${String(selected.getDate()).padStart(2,'0')}T${time}:00`
    const { data } = await supabase
      .from('events')
      .insert({ user_id: user.id, title, event_date: dateStr, color })
      .select().single()
    if (data) setEvents([...events, data])
    setTitle('')
    setShowForm(false)
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(events.filter(e => e.id !== id))
  }

  // Build calendar grid
  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function eventsForDay(day: number) {
    return events.filter(e => {
      const d = new Date(e.event_date)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
  }

  const selectedEvents = selected
    ? events.filter(e => {
        const d = new Date(e.event_date)
        return d.getDate() === selected.getDate() && d.getMonth() === selected.getMonth()
      })
    : []

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isSelected = (day: number) =>
    selected && day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear()

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-surface-900">Calendario</h1>
        <p className="text-sm text-surface-800/50 mt-1">{events.length} eventos este mes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-surface-100 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-display text-xl text-surface-900">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-surface-100 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-surface-800/40 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const dayEvents = eventsForDay(day)
              return (
                <button
                  key={i}
                  onClick={() => { setSelected(new Date(year, month, day)); setShowForm(false) }}
                  className={`relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-xs font-medium transition-all
                    ${isSelected(day) ? 'bg-accent text-white' : ''}
                    ${isToday(day) && !isSelected(day) ? 'bg-accent/10 text-accent font-bold' : ''}
                    ${!isSelected(day) && !isToday(day) ? 'hover:bg-surface-100 text-surface-800' : ''}
                  `}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <div
                          key={j}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected(day) ? 'white' : ev.color }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selected ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-surface-800/40 font-medium">
                    {DAYS[selected.getDay()]}
                  </p>
                  <p className="font-display text-2xl text-surface-900">
                    {selected.getDate()} {MONTHS[selected.getMonth()]}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="p-2 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all shadow-sm"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Form */}
              {showForm && (
                <div className="mb-4 p-3 bg-surface-50 rounded-xl border border-surface-100 space-y-2 animate-fade-up">
                  <input
                    type="text"
                    placeholder="Nombre del evento"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addEvent()}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <div className="flex items-center gap-1.5">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-surface-900 scale-110' : 'border-transparent'}`}
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

              {/* Events list */}
              <div className="space-y-2">
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-surface-800/30 text-center py-4">
                    Sin eventos — toca <strong>+</strong> para agregar
                  </p>
                ) : (
                  selectedEvents.map(ev => (
                    <div key={ev.id} className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-50 transition-all">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{ev.title}</p>
                        <p className="text-[10px] text-surface-800/40">
                          {new Date(ev.event_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 text-surface-800/20 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center text-center py-10">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm font-medium text-surface-900">Selecciona un día</p>
              <p className="text-xs text-surface-800/40 mt-1">para ver o agregar eventos</p>
            </div>
          )}

          {/* Upcoming this month */}
          {events.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold text-surface-800/50 uppercase tracking-widest mb-3">Este mes</p>
              <div className="space-y-2">
                {events
                  .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                  .slice(0, 5)
                  .map(ev => (
                    <div key={ev.id} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                      <p className="text-xs truncate flex-1">{ev.title}</p>
                      <p className="text-[10px] text-surface-800/40 flex-shrink-0">
                        {new Date(ev.event_date).getDate()} {MONTHS[new Date(ev.event_date).getMonth()].slice(0,3)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}