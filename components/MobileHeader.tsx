'use client'
import { Menu, BookOpen } from 'lucide-react'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-surface-100 flex items-center justify-between px-4 h-14 shadow-soft">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl hover:bg-surface-100 transition-all"
        aria-label="Abrir menú"
      >
        <Menu size={20} className="text-surface-800" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-sm">
          <BookOpen size={14} className="text-white" />
        </div>
        <span className="font-display text-lg text-surface-900">Studyminder</span>
      </div>

      {/* Spacer para centrar el logo */}
      <div className="w-9" />
    </header>
  )
}