import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function buildPrompt(type: string, content: string) {
  if (type === 'flashcards') return `Genera 8 flashcards de este texto. Responde SOLO con JSON válido sin texto extra:
{"flashcards":[{"front":"pregunta","back":"respuesta"}]}

Texto: ${content}`

  if (type === 'quiz') return `Genera 5 preguntas de examen con 4 opciones. Responde SOLO con JSON válido sin texto extra:
{"questions":[{"question":"...","options":["a","b","c","d"],"answer":"a"}]}

Texto: ${content}`

  return `Resume este texto en 5 puntos clave en español. Responde SOLO con JSON válido sin texto extra:
{"points":["punto 1","punto 2","punto 3","punto 4","punto 5"]}

Texto: ${content}`
}

function safeParseJSON(raw: string) {
  // 1. Quita bloques de código markdown si los hay
  let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  // 2. Extrae solo el objeto JSON (desde { hasta el último })
  const start = clean.indexOf('{')
  const end   = clean.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    clean = clean.slice(start, end + 1)
  }

  // 3. Intenta parsear — si falla, devuelve error legible
  try {
    return JSON.parse(clean)
  } catch {
    // 4. Último recurso: pide a Groq que arregle su propio JSON
    throw new Error(`JSON inválido de Groq: ${clean.slice(0, 100)}`)
  }
}

export async function POST(req: Request) {
  const { type, content } = await req.json()

  if (!content?.trim()) {
    return Response.json({ error: 'Sin contenido' }, { status: 400 })
  }

  // Limita a 10000 chars y limpia caracteres problemáticos del PDF
  const trimmed = content
    .slice(0, 10000)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // control chars
    .replace(/\\/g, '/')                                   // backslashes
    .trim()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Responde ÚNICAMENTE con JSON válido. Sin explicaciones, sin markdown, sin texto adicional.',
      },
      {
        role: 'user',
        content: buildPrompt(type, trimmed),
      },
    ],
  })

  const raw  = completion.choices[0].message.content ?? '{}'
  const data = safeParseJSON(raw)
  return Response.json(data)
}