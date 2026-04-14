'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAuth = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) setError(error.message)
      else setSuccess('Revisa tu correo para confirmar tu cuenta.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Correo o contraseña incorrectos.')
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    if (error) {
      setError('Error al conectar con Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-study/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent text-white mb-4 shadow-lg">
            <BookOpen size={22} />
          </div>
          <h1 className="font-display text-3xl text-surface-900">StudyMinder</h1>
          <p className="text-sm text-surface-800/50 mt-1">Tu espacio de estudio inteligente</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tabs */}
          <div className="flex bg-surface-100 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m ? 'bg-white text-surface-900 shadow-soft' : 'text-surface-800/50 hover:text-surface-900'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Botón de Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-surface-300 text-surface-900 text-sm font-medium transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-5 group"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin text-surface-800/50" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            <span>
              {mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
            </span>
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-xs text-surface-800/35 font-medium">o con correo</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-surface-50 border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-800/40 hover:text-surface-800 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading || googleLoading}
              className="w-full py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}