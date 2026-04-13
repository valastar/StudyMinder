import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada en .env.local' }, { status: 500 })
  }

  try {
    const body = await req.json()

    // Aplanar contenido tipo Anthropic a texto plano para Groq
    const messages = [
      ...(body.system ? [{ role: 'system', content: body.system }] : []),
      ...body.messages.map((msg: { role: string; content: string | { type: string; text?: string }[] }) => ({
        role: msg.role,
        content: typeof msg.content === 'string'
          ? msg.content
          : (msg.content as { type: string; text?: string }[])
              .filter(b => b.type === 'text')
              .map(b => b.text ?? '')
              .join('\n'),
      })),
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: body.max_tokens ?? 4000,
        temperature: 0.4,
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq error:', JSON.stringify(data))
      return NextResponse.json(
        { error: data?.error?.message ?? 'Error de Groq' },
        { status: response.status }
      )
    }

    // Devolver en formato Anthropic para que la página no cambie
    const text = data.choices?.[0]?.message?.content ?? ''
    return NextResponse.json({
      content: [{ type: 'text', text }],
    })
  } catch (err) {
    console.error('Error en route:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}