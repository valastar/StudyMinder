'use client'
import { useState } from 'react'
import { Check, Crown, Sparkles, CreditCard, Lock, User, Calendar, ChevronRight } from 'lucide-react'

interface PaymentModalProps {
  onClose: () => void
  onConfirm: () => void
}

type Step = 'plan' | 'personal' | 'card' | 'processing' | 'success'

function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}
function getCardBrand(num: string) {
  const n = num.replace(/\s/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return null
}

export default function PaymentModal({ onClose, onConfirm }: PaymentModalProps) {
  const [step, setStep] = useState<Step>('plan')

  // Datos personales
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')

  // Datos tarjeta
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  const brand = getCardBrand(cardNumber)

  const validatePersonal = () => {
    let ok = true
    if (!name.trim() || name.trim().split(' ').length < 2) {
      setNameError('Ingresa tu nombre completo'); ok = false
    } else setNameError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Correo electrónico inválido'); ok = false
    } else setEmailError('')
    return ok
  }

  const validateCard = () => {
    const errs: Record<string, string> = {}
    if (cardNumber.replace(/\s/g, '').length < 16) errs.cardNumber = 'Número de tarjeta inválido'
    if (expiry.length < 5) errs.expiry = 'Fecha inválida'
    else {
      const [m] = expiry.split('/')
      if (parseInt(m) < 1 || parseInt(m) > 12) errs.expiry = 'Mes inválido'
    }
    if (cvv.length < 3) errs.cvv = 'CVV inválido'
    if (!cardName.trim()) errs.cardName = 'Requerido'
    setCardErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePayment = () => {
    if (!validateCard()) return
    setStep('processing')
    setTimeout(() => setStep('success'), 2500)
  }

  const STEPS = ['plan', 'personal', 'card']
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-transparent"
        onClick={step !== 'processing' ? onClose : undefined}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-up overflow-hidden">

        {/* Header fijo */}
        {step !== 'processing' && step !== 'success' && (
          <div className="px-6 pt-6 pb-4 border-b border-surface-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-sm shadow-accent/30">
                  <Crown size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">Studyminder Pro</p>
                  <p className="text-[10px] text-surface-800/40">$99 MXN / mes</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Lock size={10} className="text-emerald-500" />
                <span className="text-[10px] text-emerald-600 font-medium">Pago seguro</span>
              </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1">
              {['Resumen', 'Datos', 'Pago'].map((label, i) => (
                <div key={i} className="flex items-center gap-1 flex-1">
                  <div className={`flex items-center gap-1.5 ${i <= stepIdx ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      i < stepIdx ? 'bg-emerald-500 text-white' :
                      i === stepIdx ? 'bg-accent text-white' :
                      'bg-surface-100 text-surface-800/40'
                    }`}>
                      {i < stepIdx ? <Check size={10} /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${i === stepIdx ? 'text-surface-900' : 'text-surface-800/40'}`}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-px mx-1 ${i < stepIdx ? 'bg-emerald-300' : 'bg-surface-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">

          {/* PASO 1: Resumen del plan */}
          {step === 'plan' && (
            <div>
              <h2 className="font-display text-xl text-surface-900 mb-4">Resumen de tu orden</h2>

              <div className="bg-gradient-to-br from-accent/8 to-accent/3 border border-accent/20 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-accent" />
                    <span className="text-sm font-semibold text-surface-900">Plan Pro</span>
                  </div>
                  <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-bold">Mensual</span>
                </div>
                <ul className="space-y-1.5 mb-3">
                  {['Apuntes, tareas y audios ilimitados', 'Resúmenes, Quiz y Flashcards con IA', 'Pomodoro personalizado', 'Analytics semanal / mensual', 'Export PDF'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={11} className="text-accent flex-shrink-0" />
                      <span className="text-xs text-surface-800/70">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface-50 border border-surface-100 rounded-xl p-3 mb-5 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-800/60">Plan Pro mensual</span>
                  <span className="font-medium">$99.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-800/60">IVA (16%)</span>
                  <span className="font-medium">$15.84</span>
                </div>
                <div className="border-t border-surface-200 pt-1.5 flex justify-between text-sm font-bold">
                  <span>Total hoy</span>
                  <span className="text-accent">$114.84 MXN</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
                <Sparkles size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Esta es una <strong>simulación</strong>. No se realizará ningún cargo real.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-surface-200 text-sm font-medium text-surface-800/60 hover:bg-surface-50 transition-all">
                  Cancelar
                </button>
                <button onClick={() => setStep('personal')} className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-all shadow-md shadow-accent/30 flex items-center justify-center gap-1.5">
                  Continuar <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Datos personales */}
          {step === 'personal' && (
            <div>
              <h2 className="font-display text-xl text-surface-900 mb-1">Datos personales</h2>
              <p className="text-xs text-surface-800/40 mb-5">Para enviarte tu confirmación de pago</p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-surface-800/60 mb-1.5 uppercase tracking-wide">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
                    <input
                      type="text"
                      placeholder="Juan Pérez García"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${nameError ? 'border-red-300 focus:ring-red-200' : 'border-surface-200'}`}
                    />
                  </div>
                  {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-800/60 mb-1.5 uppercase tracking-wide">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30 text-sm">@</span>
                    <input
                      type="email"
                      placeholder="juan@ejemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${emailError ? 'border-red-300 focus:ring-red-200' : 'border-surface-200'}`}
                    />
                  </div>
                  {emailError && <p className="text-[11px] text-red-500 mt-1">{emailError}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('plan')} className="flex-1 py-3 rounded-xl border border-surface-200 text-sm font-medium text-surface-800/60 hover:bg-surface-50 transition-all">
                  Atrás
                </button>
                <button
                  onClick={() => { if (validatePersonal()) setStep('card') }}
                  className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-all shadow-md shadow-accent/30 flex items-center justify-center gap-1.5"
                >
                  Continuar <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Datos de tarjeta */}
          {step === 'card' && (
            <div>
              <h2 className="font-display text-xl text-surface-900 mb-1">Datos de pago</h2>
              <p className="text-xs text-surface-800/40 mb-4">Tu información está cifrada y protegida</p>

              {/* Vista previa tarjeta */}
              <div className="relative h-32 rounded-2xl mb-5 overflow-hidden shadow-lg"
                style={{ background: 'linear-gradient(135deg, #5b4fff 0%, #3d33cc 60%, #2a228f 100%)' }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Studyminder Pro</span>
                  <div className="flex items-center gap-1">
                    {brand === 'visa' && <span className="text-white font-bold italic text-sm tracking-tight">VISA</span>}
                    {brand === 'mastercard' && (
                      <div className="flex">
                        <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
                        <div className="w-5 h-5 rounded-full bg-yellow-400 opacity-90 -ml-2" />
                      </div>
                    )}
                    {brand === 'amex' && <span className="text-white font-bold text-xs">AMEX</span>}
                    {!brand && <CreditCard size={18} className="text-white/40" />}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-mono text-sm tracking-widest mb-1">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/40 text-[9px] uppercase">Titular</p>
                      <p className="text-white text-xs font-medium truncate max-w-[160px]">
                        {cardName || 'NOMBRE APELLIDO'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-[9px] uppercase">Vence</p>
                      <p className="text-white text-xs font-mono">{expiry || 'MM/AA'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {/* Número */}
                <div>
                  <label className="block text-xs font-semibold text-surface-800/60 mb-1.5 uppercase tracking-wide">
                    Número de tarjeta
                  </label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono transition-all ${cardErrors.cardNumber ? 'border-red-300' : 'border-surface-200'}`}
                    />
                  </div>
                  {cardErrors.cardNumber && <p className="text-[11px] text-red-500 mt-1">{cardErrors.cardNumber}</p>}
                </div>

                {/* Vencimiento + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-800/60 mb-1.5 uppercase tracking-wide">
                      Vencimiento
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                        className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono transition-all ${cardErrors.expiry ? 'border-red-300' : 'border-surface-200'}`}
                      />
                    </div>
                    {cardErrors.expiry && <p className="text-[11px] text-red-500 mt-1">{cardErrors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-800/60 mb-1.5 uppercase tracking-wide">
                      CVV
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="123"
                        value={cvv}
                        maxLength={4}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono transition-all ${cardErrors.cvv ? 'border-red-300' : 'border-surface-200'}`}
                      />
                    </div>
                    {cardErrors.cvv && <p className="text-[11px] text-red-500 mt-1">{cardErrors.cvv}</p>}
                  </div>
                </div>

                {/* Nombre en tarjeta */}
                <div>
                  <label className="block text-xs font-semibold text-surface-800/60 mb-1.5 uppercase tracking-wide">
                    Nombre en la tarjeta
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
                    <input
                      type="text"
                      placeholder="Como aparece en tu tarjeta"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 uppercase transition-all ${cardErrors.cardName ? 'border-red-300' : 'border-surface-200'}`}
                    />
                  </div>
                  {cardErrors.cardName && <p className="text-[11px] text-red-500 mt-1">{cardErrors.cardName}</p>}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-accent/5 border border-accent/15 rounded-xl px-4 py-2.5 mb-4">
                <span className="text-xs font-semibold text-surface-800/60">Total a pagar</span>
                <span className="text-sm font-bold text-accent">$114.84 MXN</span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('personal')} className="flex-1 py-3 rounded-xl border border-surface-200 text-sm font-medium text-surface-800/60 hover:bg-surface-50 transition-all">
                  Atrás
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-all shadow-md shadow-accent/30 flex items-center justify-center gap-1.5"
                >
                  <Lock size={13} /> Pagar $114.84
                </button>
              </div>

              <p className="text-center text-[10px] text-surface-800/30 mt-3">
                🔒 Pago cifrado con SSL · Simulación sin cargos reales
              </p>
            </div>
          )}

          {/* Procesando */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="relative w-14 h-14 mx-auto mb-5">
                <div
                  className="absolute inset-0 rounded-full border-accent animate-spin"
                  style={{ borderWidth: 3, borderStyle: 'solid', borderTopColor: 'transparent' }}
                />
                <div className="absolute inset-2 rounded-full bg-accent/10 flex items-center justify-center">
                  <Lock size={14} className="text-accent" />
                </div>
              </div>
              <p className="font-display text-lg text-surface-900 mb-1">Procesando pago…</p>
              <p className="text-xs text-surface-800/40">Verificando tu tarjeta de forma segura</p>
            </div>
          )}

          {/* Éxito */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="relative mx-auto mb-5 w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
                <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <Check size={32} className="text-emerald-500" />
                </div>
              </div>
              <h2 className="font-display text-2xl text-surface-900 mb-1">¡Pago exitoso! 🎉</h2>
              <p className="text-xs text-surface-800/40 mb-1">Confirmación enviada a</p>
              <p className="text-sm font-semibold text-accent mb-5">{email}</p>
              <div className="bg-surface-50 border border-surface-100 rounded-xl p-3 mb-5 text-left space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-surface-800/50">Plan activado</span>
                  <span className="font-semibold text-surface-900">Pro Mensual</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-surface-800/50">Titular</span>
                  <span className="font-semibold text-surface-900">{name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-surface-800/50">Tarjeta</span>
                  <span className="font-semibold text-surface-900">•••• {cardNumber.replace(/\s/g, '').slice(-4)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-surface-800/50">Total cobrado</span>
                  <span className="font-bold text-emerald-600">$114.84 MXN</span>
                </div>
              </div>
              <button
                onClick={onConfirm}
                className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark transition-all shadow-md shadow-accent/30"
              >
                Empezar a usar Pro →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}