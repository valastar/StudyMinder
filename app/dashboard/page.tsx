'use client'
import { useAuth } from '@/context/AuthContext'
import UpcomingEvents from '@/components/UpcomingEvents'
import QuickNotes from '@/components/QuickNotes'
import PomodoroWidget from '@/components/PomodoroWidget'
import { Flame } from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useAuth()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-surface-800/40 font-medium uppercase tracking-widest mb-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-display text-4xl text-surface-900">
          {greeting}, {profile?.full_name?.split(' ')[0] ?? 'estudiante'} 👋
        </h1>

        {/* Racha de estudio */}
        {(profile?.study_streak ?? 0) > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
            <Flame size={14} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-700">
              {profile?.study_streak} días de racha 🔥
            </span>
          </div>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda: Eventos + Notas */}
        <div className="lg:col-span-2 space-y-5">
          <UpcomingEvents />
          <QuickNotes />
        </div>

        {/* Columna derecha: Pomodoro + Stats */}
        <div className="space-y-5">
          <PomodoroWidget />

          {/* Stats card */}
          <div className="card">
            <h3 className="text-xs font-semibold text-surface-800/50 uppercase tracking-widest mb-3">
              Estadísticas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-800/60">Pomodoros totales</span>
                <span className="text-sm font-semibold text-surface-900">
                  {profile?.total_pomodoros ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-800/60">Racha actual</span>
                <span className="text-sm font-semibold text-surface-900">
                  {profile?.study_streak ?? 0} días
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
