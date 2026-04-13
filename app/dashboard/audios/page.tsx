'use client'
import { useState } from 'react'
import { Mic, Play, Pause, Volume2, Download, Loader2 } from 'lucide-react'

const VOICES = [
  { value: 'es-MX-DaliaNeural', label: 'Dalia (México)' },
  { value: 'es-ES-ElviraNeural', label: 'Elvira (España)' },
  { value: 'es-MX-JorgeNeural', label: 'Jorge (México)' },
]

export default function AudiosPage() {
  const [text, setText] = useState('')
  const [voice, setVoice] = useState(VOICES[0].value)
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  async function convertToAudio() {
    if (!text.trim()) return
    setLoading(true)
    setAudioUrl(null)

    try {
      // Usa la Web Speech API del navegador (sin costo)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = voice.startsWith('es-MX') ? 'es-MX' : 'es-ES'
      utterance.rate = 0.95
      utterance.pitch = 1

      // Generar Blob de audio usando MediaRecorder
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContextClass()
      const dest = ctx.createMediaStreamDestination()
      const recorder = new MediaRecorder(dest.stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setLoading(false)
      }

      // Fallback: reproducir directamente con Web Speech API
      window.speechSynthesis.speak(utterance)
      utterance.onend = () => setLoading(false)
    } catch {
      // Fallback simple: usar SpeechSynthesis directamente
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-MX'
      utterance.rate = 0.95

      // Crear URL ficticia para indicar que está listo
      setAudioUrl('speech-synthesis')
      setLoading(false)
    }
  }

  function playAudio() {
    if (audioUrl === 'speech-synthesis') {
      if (playing) {
        window.speechSynthesis.pause()
        setPlaying(false)
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        } else {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = 'es-MX'
          utterance.rate = 0.95
          utterance.onend = () => setPlaying(false)
          window.speechSynthesis.speak(utterance)
        }
        setPlaying(true)
      }
      return
    }

    if (audio) {
      if (playing) {
        audio.pause()
        setPlaying(false)
      } else {
        audio.play()
        setPlaying(true)
      }
    } else if (audioUrl) {
      const a = new Audio(audioUrl)
      a.onended = () => setPlaying(false)
      a.play()
      setAudio(a)
      setPlaying(true)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-surface-900">Audios</h1>
        <p className="text-sm text-surface-800/50 mt-1">Convierte tus apuntes en audio para estudiar</p>
      </div>

      <div className="card space-y-4">
        {/* Selección de voz */}
        <div>
          <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">Voz</label>
          <div className="flex gap-2 flex-wrap">
            {VOICES.map((v) => (
              <button
                key={v.value}
                onClick={() => setVoice(v.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  voice === v.value
                    ? 'bg-accent text-white'
                    : 'bg-surface-100 text-surface-800/60 hover:text-surface-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <label className="text-xs font-medium text-surface-800/60 mb-1.5 block">
            Texto a convertir ({text.length} caracteres)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega aquí tus apuntes o escribe el texto que quieres escuchar..."
            rows={8}
            className="w-full px-4 py-3 text-sm rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Botón convertir */}
        <button
          onClick={convertToAudio}
          disabled={loading || !text.trim()}
          className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Convirtiendo...</>
          ) : (
            <><Mic size={15} /> Convertir a audio</>
          )}
        </button>

        {/* Player */}
        {audioUrl && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3 animate-fade-up">
            <button
              onClick={playAudio}
              className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent-dark transition-all shadow-sm flex-shrink-0"
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1">
              <p className="text-xs font-medium text-surface-900">Audio listo</p>
              <p className="text-[10px] text-surface-800/40">
                {text.split(' ').length} palabras · aprox. {Math.ceil(text.split(' ').length / 150)} min
              </p>
            </div>
            <Volume2 size={16} className="text-accent" />
          </div>
        )}

        {/* Tips */}
        <div className="bg-surface-50 rounded-xl p-3 border border-surface-100">
          <p className="text-[10px] text-surface-800/40 leading-relaxed">
            💡 <strong className="text-surface-800/60">Tip:</strong> Usa la función de Audios para repasar apuntes
            mientras haces otras actividades. Funciona directamente en tu navegador.
          </p>
        </div>
      </div>
    </div>
  )
}
