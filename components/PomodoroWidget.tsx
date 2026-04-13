'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type Mode = 'focus' | 'break'

const MODES: Record<Mode, number> = {
  focus: 2 * 60,
  break: 5 * 60,
}

export default function PomodoroWidget() {
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('focus')
  const [seconds, setSeconds] = useState(MODES.focus)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const total = MODES[mode]
  const progress = ((total - seconds) / total) * 100

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'focus') {
              setSessions((n) => n + 1)
              saveSession()
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running])

  async function saveSession() {
    if (!user) return
    await supabase.from('pomodoro_sessions').insert({
      user_id: user.id,
      duration_minutes: 1,
      completed: true,
    })
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setSeconds(MODES[m])
    setRunning(false)
  }

  const reset = () => {
    setSeconds(MODES[mode])
    setRunning(false)
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const circumference = 2 * Math.PI * 52
  const strokeDash = circumference - (progress / 100) * circumference

  return (
    <div className="card flex flex-col items-center gap-4">
      <div className="flex gap-2 w-full">
        {(['focus', 'break'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === m
                ? 'bg-accent text-white'
                : 'bg-surface-100 text-surface-800/60 hover:text-surface-900'
            }`}
          >
            {m === 'focus' ? '🎯 Enfoque' : '☕ Descanso'}
          </button>
        ))}
      </div>

      {/* Círculo */}
      <div className={`relative ${running && mode === 'focus' ? 'pomodoro-pulse rounded-full' : ''}`}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="52" fill="none" stroke="#f0f0ec" strokeWidth="8" />
          <circle
            cx="65" cy="65" r="52"
            fill="none"
            stroke={mode === 'focus' ? '#5b4fff' : '#f59e0b'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl text-surface-900">{mm}:{ss}</span>
          <span className="text-[10px] text-surface-800/40 mt-0.5">
            {mode === 'focus' ? 'enfoque' : 'descanso'}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-800/60 transition-all"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={() => setRunning(!running)}
          className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? 'Pausar' : 'Iniciar'}
        </button>
      </div>

      {/* Racha */}
      <div className="flex items-center gap-1.5 text-xs text-surface-800/50 bg-surface-50 rounded-lg px-3 py-1.5 w-full justify-center border border-surface-100">
        <Coffee size={13} className="text-amber-study" />
        <span><strong className="text-surface-900">{sessions}</strong> sesiones hoy</span>
      </div>
    </div>
  )
}
