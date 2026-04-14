"use client";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Loader2,
  Sparkles,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Note = {
  id: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  created_at: string;
};

type AIResult =
  | { type: "summary"; data: { points: string[] } }
  | { type: "flashcards"; data: { flashcards: { front: string; back: string }[] } }
  | { type: "quiz"; data: { questions: { question: string; options: string[]; answer: string }[] } };

export default function ApuntesPage() {
  const { user } = useAuth();
  const [notes, setNotes]       = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [search, setSearch]     = useState("");

  // ── IA ───────────────────────────────────────────────────────────────────
  const [aiResult, setAiResult]       = useState<AIResult | null>(null);
  const [loadingAI, setLoadingAI]     = useState(false);
  const [flipped, setFlipped]         = useState<Record<number, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

  // ── Documento externo ────────────────────────────────────────────────────
  const [docName, setDocName]       = useState<string | null>(null);
  const [docError, setDocError]     = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref para guardar el texto extraído — siempre disponible sin esperar re-render
  const docTextRef = useRef<string | null>(null);
  const [docLoaded, setDocLoaded] = useState(false); // solo para re-render del chip

  const hasTextForAI = !!(docLoaded || content.trim());

  useEffect(() => { loadNotes(); }, [user]);

  async function loadNotes() {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setNotes(data);
  }

  async function saveNote() {
    if (!user || !title.trim()) return;
    if (selected) {
      await supabase.from("notes").update({ title, content }).eq("id", selected.id);
      setNotes(notes.map((n) => (n.id === selected.id ? { ...n, title, content } : n)));
    } else {
      const { data } = await supabase
        .from("notes")
        .insert({ user_id: user.id, title, content })
        .select()
        .single();
      if (data) setNotes([data, ...notes]);
    }
    setCreating(false); setSelected(null);
    setTitle(""); setContent("");
    setAiResult(null); clearDoc();
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    setNotes(notes.filter((n) => n.id !== id));
    if (selected?.id === id) {
      setSelected(null); setTitle(""); setContent("");
      setAiResult(null); clearDoc();
    }
  }

  function clearDoc() {
    docTextRef.current = null;
    setDocLoaded(false);
    setDocName(null);
    setDocError(null);
  }

  // ── Extrae texto del archivo y luego llama a IA automáticamente ──────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocError(null);
    setLoadingDoc(true);
    clearDoc();

    try {
      let extractedText = "";

      if (file.type === "application/pdf") {
        // Carga pdf.js desde CDN
        if (!(window as any).pdfjsLib) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          await new Promise((res) => { script.onload = res; document.head.appendChild(script); });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc   = await page.getTextContent();
          text += tc.items.map((item: any) => item.str).join(" ") + "\n";
        }
        extractedText = text.trim();
      } else {
        extractedText = await file.text();
      }

      // Guarda en ref — disponible inmediatamente sin esperar re-render
      docTextRef.current = extractedText;
      setDocName(file.name);
      setDocLoaded(true);

      // Llama a IA automáticamente con el texto recién extraído
      await runAI("summary", extractedText);

    } catch (err: any) {
      setDocError("Error al leer el archivo: " + err.message);
    } finally {
      setLoadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Llama a IA con texto explícito o del ref/editor ──────────────────────
  async function runAI(type: "summary" | "flashcards" | "quiz", textOverride?: string) {
    const textToUse = textOverride ?? docTextRef.current ?? content;
    if (!textToUse?.trim()) return;

    setLoadingAI(true);
    setAiResult(null); setFlipped({}); setQuizAnswers({});

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: textToUse }),
      });
      const data = await res.json();
      setAiResult({ type, data } as AIResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  }

  // callAI para los botones manuales
  function callAI(type: "summary" | "flashcards" | "quiz") {
    runAI(type);
  }

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-surface-900">Apuntes</h1>
          <p className="text-sm text-surface-800/50 mt-1">{notes.length} notas</p>
        </div>
        <button
          onClick={() => {
            setCreating(true); setSelected(null);
            setTitle(""); setContent("");
            setAiResult(null); clearDoc();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-all shadow-sm"
        >
          <Plus size={16} /> Nueva nota
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Lista ────────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/30" />
            <input
              type="text"
              placeholder="Buscar apuntes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelected(note); setTitle(note.title);
                  setContent(note.content ?? ""); setCreating(true);
                  setAiResult(null); clearDoc();
                }}
                className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                  selected?.id === note.id
                    ? "bg-accent/5 border-accent/30"
                    : "bg-white border-surface-100 hover:border-surface-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{note.title}</p>
                    <p className="text-[10px] text-surface-800/40 mt-0.5 line-clamp-1">{note.content}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
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

        {/* ── Editor + IA ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {creating ? (
            <>
              <div className="card flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Título del apunte..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-0 py-1 text-lg font-display bg-transparent border-b border-surface-100 focus:outline-none focus:border-accent transition-all"
                />
                <textarea
                  placeholder="Escribe tus apuntes aquí..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] w-full text-sm text-surface-800 bg-transparent resize-none focus:outline-none leading-relaxed"
                />

                <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100">
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-xl hover:bg-accent-dark transition-all"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => { setCreating(false); setSelected(null); setAiResult(null); clearDoc(); }}
                    className="px-4 py-2 bg-surface-100 text-surface-800/60 text-xs font-medium rounded-xl hover:bg-surface-200 transition-all"
                  >
                    Cancelar
                  </button>

                  <div className="flex gap-2 ml-auto flex-wrap justify-end">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md"
                      className="hidden"
                      onChange={handleFile}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loadingDoc || loadingAI}
                      className="flex items-center gap-1.5 px-3 py-2 bg-surface-100 text-surface-800/70 text-xs font-medium rounded-xl hover:bg-surface-200 transition-all disabled:opacity-40 border border-surface-200"
                    >
                      {loadingDoc
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Upload size={12} />
                      }
                      {docName
                        ? docName.slice(0, 16) + (docName.length > 16 ? "…" : "")
                        : "Subir PDF / TXT"
                      }
                    </button>

                    {(["summary", "flashcards", "quiz"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => callAI(type)}
                        disabled={loadingAI || loadingDoc || !hasTextForAI}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-700 text-xs font-medium rounded-xl hover:bg-violet-100 transition-all disabled:opacity-40 border border-violet-100"
                      >
                        {loadingAI
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Sparkles size={12} />
                        }
                        {{ summary: "Resumir", flashcards: "Flashcards", quiz: "Examen" }[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chip documento cargado */}
                {docLoaded && docName && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl">
                    <FileText size={12} className="text-violet-500 flex-shrink-0" />
                    <span className="text-xs text-violet-700 flex-1 truncate">
                      Usando: <span className="font-medium">{docName}</span>
                      {' '}· {docTextRef.current?.trim().split(/\s+/).length ?? 0} palabras
                    </span>
                    <button onClick={clearDoc} className="text-violet-400 hover:text-violet-700 transition-all">
                      <X size={12} />
                    </button>
                  </div>
                )}

                {docError && (
                  <p className="text-xs text-red-500 px-1">{docError}</p>
                )}
              </div>

              {/* ── Resultado IA ───────────────────────────────────────────── */}
              {aiResult && (
                <div className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-violet-500" />
                      <span className="text-xs font-semibold text-surface-900">
                        {{ summary: "Resumen", flashcards: "Flashcards", quiz: "Examen" }[aiResult.type]}
                      </span>
                      {docName && (
                        <span className="text-[10px] text-violet-500 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                          desde {docName.slice(0, 20)}{docName.length > 20 ? "…" : ""}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setAiResult(null)}
                      className="text-surface-800/30 hover:text-surface-800 transition-all"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>

                  {/* Resumen */}
                  {aiResult.type === "summary" && (
                    <ul className="space-y-2">
                      {aiResult.data.points.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-surface-800">
                          <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Flashcards */}
                  {aiResult.type === "flashcards" && (
                    <>
                      <p className="text-[10px] text-surface-800/40">Haz clic en una tarjeta para voltearla</p>
                      <div className="grid grid-cols-2 gap-3">
                        {aiResult.data.flashcards.map((fc, i) => (
                          <div
                            key={i}
                            onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                            className={`min-h-[90px] rounded-xl border cursor-pointer p-3 flex items-center justify-center text-center text-sm transition-all ${
                              flipped[i]
                                ? "bg-accent text-white border-accent"
                                : "bg-surface-50 text-surface-800 border-surface-200 hover:border-accent/40"
                            }`}
                          >
                            {flipped[i] ? fc.back : fc.front}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Quiz */}
                  {aiResult.type === "quiz" && (
                    <div className="space-y-4">
                      {aiResult.data.questions.map((q, i) => (
                        <div key={i} className="space-y-2">
                          <p className="text-sm font-medium text-surface-900">{i + 1}. {q.question}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, j) => {
                              const letter    = ["a", "b", "c", "d"][j];
                              const chosen    = quizAnswers[i];
                              const isCorrect = letter === q.answer;
                              const isChosen  = chosen === letter;
                              return (
                                <button
                                  key={j}
                                  onClick={() => !chosen && setQuizAnswers((a) => ({ ...a, [i]: letter }))}
                                  className={`text-left px-3 py-2 rounded-xl text-xs border transition-all ${
                                    !chosen
                                      ? "bg-surface-50 border-surface-200 hover:border-accent/40"
                                      : isChosen && isCorrect
                                      ? "bg-green-50 border-green-300 text-green-800"
                                      : isChosen && !isCorrect
                                      ? "bg-red-50 border-red-300 text-red-800"
                                      : isCorrect
                                      ? "bg-green-50 border-green-200 text-green-700"
                                      : "bg-surface-50 border-surface-100 text-surface-400"
                                  }`}
                                >
                                  <span className="font-medium uppercase">{letter})</span> {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center text-center">
              <FileText size={36} className="text-surface-800/15 mb-3" />
              <p className="text-sm text-surface-800/40">Selecciona o crea un apunte</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}