'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Search, Trash2, FileText, Upload, X,
  Loader2, RefreshCw, Bold, Italic, List, ListOrdered,
  Heading2, Heading3, Undo, Redo, Code, Quote, Minus
} from 'lucide-react'
import { UnderlineIcon } from 'lucide-react'
import { supabase, Note } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'

// ─── PDF text extractor ───────────────────────────────────────────────────────

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = e => resolve(e.target?.result as string)
      r.onerror = reject
      r.readAsText(file)
    })
  }

  if (file.type === 'application/pdf') {
    return new Promise((resolve, reject) => {
      // Cargar pdf.js solo si no está ya cargado
      if ((window as unknown as Record<string, unknown>).pdfjsLib) {
        extractPdfText(resolve, reject, file)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => extractPdfText(resolve, reject, file)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  throw new Error('Solo se aceptan PDF o TXT')
}

async function extractPdfText(
  resolve: (v: string) => void,
  reject: (e: unknown) => void,
  file: File
) {
  try {
    type PdfjsLib = {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (src: { data: ArrayBuffer }) => {
        promise: Promise<{
          numPages: number
          getPage: (n: number) => Promise<{
            getTextContent: () => Promise<{ items: { str: string }[] }>
          }>
        }>
      }
    }
    const pdfjsLib = (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      pages.push(content.items.map(item => item.str).join(' '))
    }
    resolve(pages.join('\n'))
  } catch (e) {
    reject(e)
  }
}

// ─── Generar resumen via Groq ─────────────────────────────────────────────────

async function generateSummary(text: string): Promise<string> {
  const system = `Eres un asistente académico experto en crear materiales de estudio claros y efectivos en español.
Tu tarea es transformar el texto del usuario en un resumen estructurado y fácil de estudiar.

FORMATO DE RESPUESTA (usa exactamente esta estructura en Markdown):
## 📌 Idea principal
Una o dos oraciones que capturen el núcleo del tema.

## 🔑 Conceptos clave
- **Concepto**: Explicación breve y clara
(Lista todos los conceptos importantes)

## 📝 Desarrollo
Explicación ordenada de los puntos principales, en párrafos cortos. Sin texto innecesario.

## ⚡ Puntos para recordar
- Punto esencial 1
- Punto esencial 2
(Los datos más importantes que NO se deben olvidar)

Responde SOLO con el resumen en Markdown, sin texto adicional antes ni después.`

  const response = await fetch('/api/study', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system,
      max_tokens: 2000,
      messages: [{ role: 'user', content: text.slice(0, 12000) }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error ?? 'Error al conectar con la API')
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${
        active
          ? 'bg-accent text-white'
          : 'text-surface-800/60 hover:bg-surface-100 hover:text-surface-900'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-surface-100 bg-surface-50/50 rounded-t-xl">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer">
        <Undo size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer">
        <Redo size={14} />
      </ToolbarButton>
      <div className="w-px h-4 bg-surface-200 mx-1" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado">
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Código">
        <Code size={14} />
      </ToolbarButton>
      <div className="w-px h-4 bg-surface-200 mx-1" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Encabezado 2">
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Encabezado 3">
        <Heading3 size={14} />
      </ToolbarButton>
      <div className="w-px h-4 bg-surface-200 mx-1" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">
        <Minus size={14} />
      </ToolbarButton>
    </div>
  )
}

// ─── WYSIWYG Editor ───────────────────────────────────────────────────────────

function NoteEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Escribe tus apuntes aquí...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[220px] px-4 py-3 focus:outline-none text-surface-800',
      },
    },
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content ?? '')
    }
  }, [content]) // eslint-disable-line

  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

// ─── Summary Panel ────────────────────────────────────────────────────────────

function SummaryPanel({ onInsert }: { onInsert: (html: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [summary, setSummary] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      setError('Solo se aceptan PDF y TXT')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Máximo 20 MB')
      return
    }

    setUploading(true)
    setError('')
    setSummary('')
    setFileName(file.name)

    try {
      const text = await extractTextFromFile(file)
      if (!text.trim()) throw new Error('No se pudo extraer texto del documento')
      const result = await generateSummary(text)
      setSummary(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el documento')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Convertir markdown básico a HTML para insertar en el editor
  function markdownToHtml(md: string): string {
    return md
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])/gm, '')
      .split('\n')
      .filter(l => l.trim())
      .join('\n')
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-surface-900">✨ Resumir con IA</span>
        {fileName && !uploading && (
          <div className="flex items-center gap-1.5 text-[10px] text-surface-800/40">
            <FileText size={11} />
            <span className="truncate max-w-32">{fileName}</span>
            <button onClick={() => { setSummary(''); setFileName('') }}>
              <X size={11} className="hover:text-red-400 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* Drop zone */}
      {!summary && !uploading && (
        <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all">
          <Upload size={22} className="text-surface-800/30" />
          <span className="text-xs text-surface-800/50 text-center">
            Sube tu documento y Groq AI te genera un resumen estructurado para estudiar
          </span>
          <span className="text-[10px] text-surface-800/30">PDF · TXT — máx. 20 MB</span>
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt" onChange={handleFile} />
          <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-lg hover:bg-accent/20 transition-all mt-1">
            Elegir archivo
          </span>
        </label>
      )}

      {/* Cargando */}
      {uploading && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 size={24} className="text-accent animate-spin" />
          <p className="text-xs text-surface-800/50">Groq está resumiendo tu documento...</p>
          <p className="text-[10px] text-surface-800/30">Suele tardar menos de 10 segundos</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Resumen generado */}
      {summary && !uploading && (
        <div className="space-y-3">
          {/* Preview del resumen */}
          <div className="bg-surface-50 rounded-xl p-4 max-h-72 overflow-y-auto">
            <div
              className="prose prose-sm max-w-none text-surface-800"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onInsert(markdownToHtml(summary))}
              className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-xl hover:bg-accent-dark transition-all"
            >
              Insertar en apunte
            </button>
            <label className="flex items-center gap-1.5 text-xs text-surface-800/40 cursor-pointer hover:text-surface-800/60 transition-all">
              <RefreshCw size={12} />
              Subir otro
              <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFile} />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApuntesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) loadNotes()
  }, [user])

  async function loadNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
    if (data) setNotes(data)
  }

  const handleContentChange = useCallback((html: string) => {
    setContent(html)
  }, [])

  function handleInsertSummary(html: string) {
    setContent(html)
    if (!creating) setCreating(true)
  }

  async function saveNote() {
    if (!title.trim() || !user) return
    if (selected) {
      await supabase.from('notes').update({ title, content }).eq('id', selected.id)
      setNotes(notes.map(n => n.id === selected.id ? { ...n, title, content } : n))
    } else {
      const { data } = await supabase
        .from('notes')
        .insert({ user_id: user.id, title, content })
        .select()
        .single()
      if (data) setNotes([data, ...notes])
    }
    setCreating(false)
    setSelected(null)
    setTitle('')
    setContent('')
  }

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(notes.filter(n => n.id !== id))
    if (selected?.id === id) { setSelected(null); setTitle(''); setContent('') }
  }

  function openNote(note: Note) {
    setSelected(note)
    setTitle(note.title)
    setContent(note.content ?? '')
    setCreating(true)
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`
        .prose h2 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.4rem; color: #3730a3; }
        .prose h3 { font-size: 0.95rem; font-weight: 600; margin: 0.75rem 0 0.3rem; }
        .prose p { margin: 0.4rem 0; line-height: 1.6; }
        .prose ul { list-style: disc; padding-left: 1.4rem; margin: 0.4rem 0; }
        .prose ol { list-style: decimal; padding-left: 1.4rem; margin: 0.4rem 0; }
        .prose li { margin: 0.25rem 0; line-height: 1.5; }
        .prose strong { font-weight: 600; color: #1e1b4b; }
        .prose em { font-style: italic; }
        .prose u { text-decoration: underline; }
        .prose code { background: #f1f1f0; border-radius: 4px; padding: 1px 5px; font-size: 0.8em; font-family: monospace; }
        .prose blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; color: #555; margin: 0.5rem 0; font-style: italic; }
        .prose hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .tiptap p.is-editor-empty:first-child::before {
          color: #adb5bd; content: attr(data-placeholder); float: left; height: 0; pointer-events: none;
        }
      `}</style>

      <div className="max-w-6xl mx-auto animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-surface-900">Apuntes</h1>
            <p className="text-sm text-surface-800/50 mt-1">{notes.length} notas</p>
          </div>
          <button
            onClick={() => { setSelected(null); setTitle(''); setContent(''); setCreating(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-all shadow-sm"
          >
            <Plus size={16} /> Nueva nota
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lista */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
              <input
                type="text"
                placeholder="Buscar apuntes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.map(note => (
                <div
                  key={note.id}
                  onClick={() => openNote(note)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                    selected?.id === note.id
                      ? 'bg-accent/5 border-accent/30'
                      : 'bg-white border-surface-100 hover:border-surface-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{note.title}</p>
                      <p
                        className="text-[10px] text-surface-800/40 mt-0.5 line-clamp-1"
                        dangerouslySetInnerHTML={{
                          __html: note.content?.replace(/<[^>]+>/g, ' ').slice(0, 80) ?? ''
                        }}
                      />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                      className="opacity-0 group-hover:opacity-100 text-surface-800/30 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8">
                  <FileText size={28} className="text-surface-800/20 mx-auto mb-2" />
                  <p className="text-xs text-surface-800/30">Sin apuntes</p>
                </div>
              )}
            </div>
          </div>

          {/* Editor + Resumen */}
          <div className="lg:col-span-2 space-y-4">
            {creating ? (
              <>
                <div className="card flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Título del apunte..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-0 py-1 text-lg font-display bg-transparent border-b border-surface-100 focus:outline-none focus:border-accent transition-all"
                  />
                  <NoteEditor content={content} onChange={handleContentChange} />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveNote}
                      className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-xl hover:bg-accent-dark transition-all"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => { setCreating(false); setSelected(null) }}
                      className="px-4 py-2 bg-surface-100 text-surface-800/60 text-xs font-medium rounded-xl hover:bg-surface-200 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                <SummaryPanel onInsert={handleInsertSummary} />
              </>
            ) : (
              <div className="card h-full flex flex-col items-center justify-center text-center min-h-[300px]">
                <FileText size={36} className="text-surface-800/15 mb-3" />
                <p className="text-sm text-surface-800/40">Selecciona o crea un apunte</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}