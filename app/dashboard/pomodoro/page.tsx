'use client'
import PomodoroWidget from '@/components/PomodoroWidget'

export default function PomodoroPage() {
  return (
    <div className="max-w-md mx-auto animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-surface-900">Pomodoro</h1>
        <p className="text-sm text-surface-800/50 mt-1">Gestiona tu tiempo de enfoque</p>
      </div>
      <PomodoroWidget />
    </div>
  )
}
