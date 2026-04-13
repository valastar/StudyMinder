'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Mic, Play, Pause, Volume2, Loader2, Save, Trash2,
  RefreshCw, Clock, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

// ── Tipos ──────────────────────────────────────────────────────────────────
type AudioTTS = {
  id: string
  user_id: string
  title: string
  text_content: string
  voice: string
  rate: number
  loop_enabled: boolean
  duration_estimate: number | null
  created_at: string
}

// ── Voces disponibles ──────────────────────────────────────────────────────
const VOICES = [
  { value: 'es-MX', label: '🇲🇽 Español México' },
  { value: 'es-ES', label: '🇪🇸 Español España' },
  { value: 'en-US', label: '🇺🇸 English US' },
  { value: 'en-GB', label: '🇬🇧 English UK' },
  { value: 'fr-FR', label: '🇫🇷 Français' },
  { value: 'de-DE', label: '🇩🇪 Deutsch' },
]

// ── Velocidades ────────────────────────────────────────────────────────────
const RATES = [
  { value: 0.5,  label: '0.5×' },
  { value: 0.75, label: '0.75×' },
  { value: 1.0,  label: '1×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5,  label: '1.5×' },
  { value: 2.0,  label: '2×' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function estimateDuration(text: string, rate: number): number {
  const words = text.trim().split(/\s+/).length
  const seconds = Math.ceil((words / 150) * 60 / rate)
  return seconds
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

// ── Componente principal ───────────────────────────────────────────────────
export default function AudiosPage() {
  const { user } = useAuth()

  // Estado del formulario
  const [text, setText]         = useState('')
  const [title, setTitle]       = useState('')
  const [voice, setVoice]       = useState('es-MX')
  const [rate, setRate]         = useState(1.0)
  const [loopEnabled, setLoop]  = useState(false)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)

  // Estado del reproductor activo
  const [activeId, setActiveId]   = useState<string | null>(null)
  const [playing, setPlaying]     = useState(false)
  const [progress, setProgress]   = useState(0) // 0-100
  const utteranceRef              = useRef<SpeechSynthesisUtterance | null>(null)
  const progressTimer             = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef              = useRef<number>(0)
  const durationRef               = useRef<number>(0)

  // Lista de audios guardados
  const [audios, setAudios]       = useState<AudioTTS[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [expandedId, setExpandedId]  = useState<string | null>(null)

  // ── Cargar audios guardados ──────────────────────────────────────────────
  useEffect(() => {
    if (user) loadAudios()
    return () => stopAudio()
  }, [user])

  async function loadAudios() {
    setLoadingList(true)
    const { data } = await supabase
      .from('audio_tts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    if (data) setAudios(data as AudioTTS[])
    setLoadingList(false)
  }

  // ── Guardar audio en Supabase ────────────────────────────────────────────
  async function saveAudio() {
    if (!text.trim() || !user) return
    setSaving(true)

    const autoTitle = title.trim() || text.trim().slice(0, 40) + (text.length > 40 ? '...' : '')
    const duration  = estimateDuration(text, rate)

    const { data, error } = await supabase
      .from('audio_tts')
      .insert({
        user_id:           user.id,
        title:             autoTitle,
        text_content:      text.trim(),
        voice,
        rate,
        loop_enabled:      loopEnabled,
        duration_estimate: duration,
      })
      .select()
      .single()

    if (!error && data) {
      setAudios([data as AudioTTS, ...audios])
      setText('')
      setTitle('')
    }
    setSaving(false)
  }

  // ── Motor TTS ────────────────────────────────────────────────────────────
  function stopAudio() {
    window.speechSynthesis?.cancel()
    setPlaying(false)
    setProgress(0)
    if (progressTimer.current) clearInterval(progressTimer.current)
  }

  function startProgressTimer(durationSec: number) {
    startTimeRef.current = Date.now()
    durationRef.current  = durationSec * 1000
    if (progressTimer.current) clearInterval(progressTimer.current)
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct     = Math.min((elapsed / durationRef.current) * 100, 99)
      setProgress(pct)
    }, 200)
  }

  function speakAudio(audio: AudioTTS, onEnd?: () => void) {
    window.speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(audio.text_content)
    utt.lang  = audio.voice
    utt.rate  = audio.rate

    // Intentar asignar una voz nativa que coincida con el idioma
    const voices = window.speechSynthesis.getVoices()
    const match  = voices.find(
      (v) => v.lang.startsWith(audio.voice) && !v.localService === false
    ) ?? voices.find((v) => v.lang.startsWith(audio.voice))
    if (match) utt.voice = match

    const estSec = audio.duration_estimate ?? estimateDuration(audio.text_content, audio.rate)
    startProgressTimer(estSec)

    utt.onend = () => {
      if (progressTimer.current) clearInterval(progressTimer.current)
      setProgress(100)
      if (audio.loop_enabled) {
        // Pequeño delay antes de repetir
        setTimeout(() => {
          setProgress(0)
          speakAudio(audio, onEnd)
        }, 600)
      } else {
        setPlaying(false)
        setProgress(0)
        setActiveId(null)
        onEnd?.()
      }
    }

    utteranceRef.current = utt
    window.speechSynthesis.speak(utt)
    setPlaying(true)
  }

  function handlePlay(audio: AudioTTS) {
    // Si ya está reproduciendo este audio → pausar/reanudar
    if (activeId === audio.id) {
      if (playing) {
        window.speechSynthesis.pause()
        setPlaying(false)
        if (progressTimer.current) clearInterval(progressTimer.current)
      } else {
        window.speechSynthesis.resume()
        setPlaying(true)
        // Reanudar timer desde donde quedó
        const remaining = durationRef.current - (Date.now() - startTimeRef.current)
        startTimeRef.current = Date.now() - (durationRef.current - Math.max(remaining, 0))
        startProgressTimer(durationRef.current / 1000)
      }
      return
    }

    // Reproducir audio nuevo
    stopAudio()
    setActiveId(audio.id)
    setProgress(0)
    speakAudio(audio)
  }

  function handleStop(e: React.MouseEvent) {
    e.stopPropagation()
    stopAudio()
    setActiveId(null)
  }

  // ── Eliminar audio ───────────────────────────────────────────────────────
  async function deleteAudio(id: string) {
    if (activeId === id) stopAudio()
    await supabase.from('audio_tts').delete().eq('id', id)
    setAudios(audios.filter((a) => a.id !== id))
    if (activeId === id) setActiveId(null)
  }

  // ── Preview rápido (sin guardar) ─────────────────────────────────────────
  function previewSpeech() {
    if (!text.trim()) return
    stopAudio()
    const preview: AudioTTS = {
      id:                '__preview__',
      user_id:           user?.id ?? '',
      title:             'Preview',
      text_content:      text,
      voice,
      rate,
      loop_enabled:      false,
      duration_estimate: estimateDuration(text, rate),
      created_at:        new Date().toISOString(),
    }
    setActiveId('__preview__')
    speakAudio(preview)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-surface-900">Audios</h1>
        <p className="text-sm text-surface-800/50 mt-1">Convierte tus apuntes en audio y guárdalos para repasar</p>
      </div>

      {/* ── Formulario creador ───────────────────────────────────────────── */}
      <div className="card space-y-4 mb-6">
        {/* Título */}
        <div>
          <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">
            Título (opcional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Biología Unidad 3..."
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        {/* Textarea */}
        <div>
          <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">
            Texto a convertir
            {text.length > 0 && (
              <span className="ml-2 text-surface-800/40">
                · {text.trim().split(/\s+/).length} palabras
                · ~{formatDuration(estimateDuration(text, rate))}
              </span>
            )}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega aquí tus apuntes o escribe el texto que quieres escuchar..."
            rows={7}
            className="w-full px-4 py-3 text-sm rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Controles: voz + velocidad */}
        <div className="grid grid-cols-2 gap-4">
          {/* Voz */}
          <div>
            <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">Idioma / Voz</label>
            <div className="relative">
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none pr-8 cursor-pointer"
              >
                {VOICES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-800/40 pointer-events-none" />
            </div>
          </div>

          {/* Velocidad */}
          <div>
            <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">Velocidad</label>
            <div className="flex gap-1 flex-wrap">
              {RATES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRate(r.value)}
                  className={`flex-1 min-w-0 py-1.5 text-xs rounded-lg font-medium transition-all ${
                    rate === r.value
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-surface-100 text-surface-800/60 hover:text-surface-900 hover:bg-surface-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loop toggle */}
        <button
          onClick={() => setLoop(!loopEnabled)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all w-full ${
            loopEnabled
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-surface-50 border-surface-200 text-surface-800/60 hover:text-surface-900'
          }`}
        >
          <RotateCcw size={15} className={loopEnabled ? 'animate-spin-slow' : ''} />
          <span>Repetir en loop</span>
          <div className={`ml-auto w-9 h-5 rounded-full transition-all relative ${loopEnabled ? 'bg-accent' : 'bg-surface-200'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${loopEnabled ? 'left-4.5' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Botones acción */}
        <div className="flex gap-2">
          {/* Preview */}
          <button
            onClick={activeId === '__preview__' && playing ? () => { stopAudio(); setActiveId(null) } : previewSpeech}
            disabled={!text.trim()}
            className="flex-1 py-2.5 bg-surface-100 text-surface-800 text-sm font-medium rounded-xl hover:bg-surface-200 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {activeId === '__preview__' && playing
              ? <><Pause size={15} /> Detener preview</>
              : <><Play size={15} /> Escuchar preview</>
            }
          </button>

          {/* Guardar */}
          <button
            onClick={saveAudio}
            disabled={saving || !text.trim()}
            className="flex-1 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
              : <><Save size={15} /> Guardar audio</>
            }
          </button>
        </div>
      </div>

      {/* ── Lista de audios guardados ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-surface-900">
            Audios guardados
            {audios.length > 0 && (
              <span className="ml-2 text-xs text-surface-800/40 font-normal">{audios.length}</span>
            )}
          </h2>
          <button
            onClick={loadAudios}
            className="p-1.5 hover:bg-surface-100 rounded-lg transition-all text-surface-800/40 hover:text-surface-800"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : audios.length === 0 ? (
          <div className="card text-center py-10">
            <Mic size={28} className="text-surface-800/20 mx-auto mb-2" />
            <p className="text-sm text-surface-800/40">Aún no tienes audios guardados.</p>
            <p className="text-xs text-surface-800/30 mt-1">Crea uno arriba y presiona "Guardar audio".</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audios.map((audio) => {
              const isActive   = activeId === audio.id
              const isPlaying  = isActive && playing
              const isExpanded = expandedId === audio.id

              return (
                <div
                  key={audio.id}
                  className={`card p-4 transition-all border ${
                    isActive
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-surface-100 hover:border-surface-200'
                  }`}
                >
                  {/* Row principal */}
                  <div className="flex items-center gap-3">
                    {/* Play/Pause button */}
                    <button
                      onClick={() => handlePlay(audio)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                        isActive
                          ? 'bg-accent text-white'
                          : 'bg-surface-100 text-surface-800 hover:bg-accent hover:text-white'
                      }`}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{audio.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-surface-800/40">
                          {VOICES.find((v) => v.value === audio.voice)?.label ?? audio.voice}
                        </span>
                        <span className="text-[10px] text-surface-800/30">·</span>
                        <span className="text-[10px] text-surface-800/40">{audio.rate}×</span>
                        {audio.loop_enabled && (
                          <>
                            <span className="text-[10px] text-surface-800/30">·</span>
                            <span className="text-[10px] text-accent flex items-center gap-0.5">
                              <RotateCcw size={9} /> loop
                            </span>
                          </>
                        )}
                        {audio.duration_estimate && (
                          <>
                            <span className="text-[10px] text-surface-800/30">·</span>
                            <span className="text-[10px] text-surface-800/40 flex items-center gap-0.5">
                              <Clock size={9} /> {formatDuration(audio.duration_estimate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stop (solo si activo) */}
                    {isActive && (
                      <button
                        onClick={handleStop}
                        className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-all"
                        title="Detener"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}

                    {/* Expandir texto */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : audio.id)}
                      className="p-1.5 hover:bg-surface-100 text-surface-800/40 rounded-lg transition-all"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Borrar */}
                    <button
                      onClick={() => deleteAudio(audio.id)}
                      className="p-1.5 hover:bg-red-50 text-surface-800/30 hover:text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Barra de progreso */}
                  {isActive && (
                    <div className="mt-3 h-1 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Texto expandido */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-surface-100">
                      <p className="text-xs text-surface-800/60 leading-relaxed line-clamp-6">
                        {audio.text_content}
                      </p>
                      <p className="text-[10px] text-surface-800/30 mt-2">
                        Guardado: {formatDate(audio.created_at)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}