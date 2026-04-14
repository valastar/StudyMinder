'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen, Timer, FileText, Mic, CheckSquare, Calendar, LogOut, User, X, Crown
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard',                icon: BookOpen,    label: 'Inicio' },
  { href: '/dashboard/pomodoro',       icon: Timer,       label: 'Pomodoro' },
  { href: '/dashboard/apuntes',        icon: FileText,    label: 'Apuntes' },
  { href: '/dashboard/audios',         icon: Mic,         label: 'Audios' },
  { href: '/dashboard/tareas',         icon: CheckSquare, label: 'Tareas' },
  { href: '/dashboard/calendario',     icon: Calendar,    label: 'Calendario' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  return (
    <>
      {/* Overlay — solo en mobile cuando está abierto */}
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 bottom-0 z-40 w-60 bg-white border-r border-surface-100 flex flex-col py-6 px-3 shadow-soft',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + botón cerrar (solo mobile) */}
        <div className="flex items-center justify-between px-3 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-sm">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-display text-xl text-surface-900">Studyminder</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-100 transition-all"
            aria-label="Cerrar menú"
          >
            <X size={16} className="text-surface-800/60" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={clsx('sidebar-link', { active: pathname === href })}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}

          {/* Separador */}
          <div className="pt-2 pb-1">
            <div className="border-t border-surface-100" />
          </div>

          {/* Membresías — destacado */}
          <Link
            href="/dashboard/membresias"
            onClick={onClose}
            className={clsx(
              'sidebar-link',
              pathname === '/dashboard/membresias'
                ? 'active'
                : 'text-accent/80 hover:text-accent hover:bg-accent/8'
            )}
          >
            <Crown size={17} />
            <span>Membresías</span>
            {pathname !== '/dashboard/membresias' && (
              <span className="ml-auto text-[9px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                Pro
              </span>
            )}
          </Link>
        </nav>

        {/* Usuario */}
        <div className="border-t border-surface-100 pt-4 mt-4">
          <div className="flex items-center gap-2.5 px-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
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
    </>
  )
}