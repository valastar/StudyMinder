'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen, Timer, FileText, Mic, CheckSquare, Calendar, LogOut, User
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard',         icon: BookOpen,    label: 'Inicio' },
  { href: '/dashboard/pomodoro',icon: Timer,       label: 'Pomodoro' },
  { href: '/dashboard/apuntes', icon: FileText,    label: 'Apuntes' },
  { href: '/dashboard/audios',  icon: Mic,         label: 'Audios' },
  { href: '/dashboard/tareas',  icon: CheckSquare, label: 'Tareas' },
  { href: '/dashboard/calendario', icon: Calendar, label: 'Calendario' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-surface-100 flex flex-col py-6 px-3 shadow-soft fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-sm">
          <BookOpen size={16} className="text-white" />
        </div>
        <span className="font-display text-xl text-surface-900">Studyminder</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx('sidebar-link', { active: pathname === href })}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Usuario */}
      <div className="border-t border-surface-100 pt-4 mt-4">
        <div className="flex items-center gap-2.5 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <User size={15} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{profile?.full_name ?? 'Usuario'}</p>
            <p className="text-[10px] text-surface-800/40 truncate">
              🔥 {profile?.study_streak ?? 0} días de racha
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="sidebar-link w-full text-red-400 hover:text-red-500 hover:bg-red-50"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
