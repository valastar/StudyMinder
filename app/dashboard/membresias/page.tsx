'use client'
import { useState } from 'react'
import {
  Check, Zap, Crown, Sparkles, FileText, CheckSquare,
  Mic, Calendar, Timer, Brain, BarChart2, FileDown, Star,
} from 'lucide-react'
import { ElementType } from 'react'
import FeatureValue from '@/components/membresias/FeatureValue'
import FeatureRow from '@/components/membresias/FeatureRow'
import PaymentModal from '@/components/membresias/PaymentModal'

const FEATURES: { icon: ElementType; label: string; gratis: string | boolean; pro: string | boolean }[] = [
  { icon: FileText,    label: 'Apuntes',           gratis: '15',          pro: 'Ilimitado' },
  { icon: CheckSquare, label: 'Tareas',             gratis: '30',          pro: 'Ilimitado' },
  { icon: Mic,         label: 'Audios TTS',         gratis: '5 guardados', pro: 'Ilimitado' },
  { icon: Calendar,    label: 'Eventos calendario', gratis: '15',          pro: 'Ilimitado' },
  { icon: Timer,       label: 'Pomodoro',           gratis: '25/5 fijo',   pro: 'Personalizado' },
  { icon: Brain,       label: 'Resúmenes IA',       gratis: false,         pro: 'Ilimitado' },
  { icon: Sparkles,    label: 'Quiz IA',            gratis: false,         pro: 'Ilimitado' },
  { icon: Zap,         label: 'Flashcards IA',      gratis: false,         pro: 'Ilimitado' },
  { icon: FileDown,    label: 'Export PDF',         gratis: false,         pro: true },
]

export default function MembresiasPage() {
  const [showModal, setShowModal] = useState(false)
  const [isPro, setIsPro] = useState(false)

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full mb-4">
          <Crown size={12} className="text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">Membresías</span>
        </div>
        <h1 className="font-display text-4xl text-surface-900 mb-3">Elige tu plan</h1>
        <p className="text-sm text-surface-800/50 max-w-md mx-auto leading-relaxed">
          Empieza gratis y actualiza cuando lo necesites. Sin contratos, cancela cuando quieras.
        </p>
      </div>

      {/* Badge plan activo */}
      {isPro && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
            <Check size={13} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Estás en el plan Pro</span>
          </div>
        </div>
      )}

      {/* Cards de planes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">

        {/* Plan Gratis */}
        <div className="rounded-3xl border border-surface-200 shadow-soft overflow-hidden">
          <div className="p-6 bg-white">
            <div className="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
              <Star size={18} className="text-surface-800/50" />
            </div>
            <h2 className="font-display text-2xl text-surface-900 mb-1">Gratis</h2>
            <p className="text-xs text-surface-800/50 mb-4 leading-relaxed">
              Perfecto para empezar a organizar tus estudios.
            </p>
            <div className="flex items-end gap-1.5 mb-5">
              <span className="font-display text-4xl text-surface-900">$0</span>
              <span className="text-xs text-surface-800/40 mb-1.5 font-medium">para siempre</span>
            </div>
            <button
              disabled
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-surface-200 text-surface-800/40 bg-surface-50 cursor-default"
            >
              {!isPro ? '✓ Plan actual' : 'Gratis'}
            </button>
          </div>
          <div className="px-6 pb-6 bg-white space-y-2 pt-1">
            <FeatureRow icon={FileText}    text="15 apuntes" />
            <FeatureRow icon={CheckSquare} text="30 tareas" />
            <FeatureRow icon={Mic}         text="5 audios guardados" />
            <FeatureRow icon={Calendar}    text="15 eventos" />
          </div>
        </div>

        {/* Plan Pro */}
        <div className="rounded-3xl border border-accent/30 shadow-xl shadow-accent/10 overflow-hidden relative">
          <div className="absolute top-4 right-4">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-white text-[10px] font-bold rounded-full uppercase tracking-wide shadow-sm">
              <Sparkles size={9} />
              Popular
            </div>
          </div>
          <div className="p-6 bg-gradient-to-br from-accent/8 to-accent/3">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center mb-4 shadow-md shadow-accent/30">
              <Crown size={18} className="text-white" />
            </div>
            <h2 className="font-display text-2xl text-surface-900 mb-1">Pro</h2>
            <p className="text-xs text-surface-800/50 mb-4 leading-relaxed">
              Para estudiantes serios que quieren dominar su rendimiento.
            </p>
            <div className="flex items-end gap-1.5 mb-5">
              <span className="font-display text-4xl text-surface-900">$50</span>
              <span className="text-xs text-surface-800/40 mb-1.5 font-medium">al mes</span>
            </div>
            <button
              onClick={() => { if (!isPro) setShowModal(true) }}
              disabled={isPro}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isPro
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                  : 'bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/30 active:scale-[0.98]'
              }`}
            >
              {isPro ? '✓ Plan activo' : 'Activar Pro →'}
            </button>
          </div>
          <div className="px-6 pb-6 bg-gradient-to-br from-accent/3 to-transparent space-y-2 pt-3">
            <FeatureRow icon={FileText}  text="Apuntes ilimitados"               pro />
            <FeatureRow icon={Brain}     text="Resúmenes + Quiz + Flashcards IA" pro />
            <FeatureRow icon={Timer}     text="Pomodoro personalizado"           pro />
            <FeatureRow icon={FileDown}  text="Export PDF"                       pro />
          </div>
        </div>
      </div>

      {/* Tabla comparativa */}
      <div className="card overflow-hidden">
        <h3 className="text-xs font-bold text-surface-800/40 uppercase tracking-widest mb-5">
          Comparativa completa
        </h3>
        <div className="grid grid-cols-[1fr_80px_80px] items-center mb-3 px-1">
          <div />
          <div className="text-center">
            <span className="text-xs font-semibold text-surface-800/50">Gratis</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-accent">Pro</span>
          </div>
        </div>
        <div className="space-y-1">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className={`grid grid-cols-[1fr_80px_80px] items-center px-3 py-2.5 rounded-xl ${
                  i % 2 === 0 ? 'bg-surface-50' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={12} className="text-surface-800/50" />
                  </div>
                  <span className="text-xs text-surface-800/70 font-medium">{f.label}</span>
                </div>
                <div className="text-center">
                  <FeatureValue value={f.gratis} />
                </div>
                <div className="text-center">
                  <FeatureValue value={f.pro} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-surface-800/40">
          ¿Preguntas? Escríbenos a{' '}
          <span className="text-accent font-medium">soporte@studyminder.app</span>
        </p>
      </div>

      {showModal && (
        <PaymentModal
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setIsPro(true)
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}