import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: 'Chave Fal.ai ausente.' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const text = (body.text || '').trim();
    
    if (!text) {
      return NextResponse.json({ error: 'Descrição vazia.' }, { status: 400 });
    }

    // PASSO 1: O GEOMETRISTA (Fim da mutação para esportivos)
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert automotive geometric designer. The user will give you a car description. Your job is to create a 'Visual Geometry Blueprint' so an image AI perfectly recreates it without hallucinating modern or incorrect shapes.
          1. Identify the exact make, model, and year.
          2. Describe its EXACT body style and geometry (e.g., small 2-door economy hatchback, compact simple lines).
          3. Detail the headlights shape, grille design, and stance.
          4. CRITICAL: If it's a South American/regional commuter car (like Chevrolet Celta, Fiat Palio, VW Gol), explicitly command the AI to keep the design basic, rounded, and economical. Strictly FORBID it from looking like a modern sports car, Veloster, or having aggressive aero kits unless the user asked for it.
          Output ONLY the visual blueprint paragraph.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: O ENGENHEIRO DE PROMPT (Isolamento de Teto e Detalhes)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Using the car blueprint and user request, generate a strict, highly detailed English prompt for the FLUX Dev image generator.

          CRITICAL RULES (THE INFINITE ISOLATION PROTOCOL):
          1. Follow the anatomical blueprint strictly to maintain the exact commuter or specific shape. Do not make standard cars look like supercars.
          2. UNIVERSAL COMPONENT ISOLATION: Treat the car as an assembly of separate 3D parts.
          3. ROOF vs PILLARS ISOLATION (CRITICAL): If a specific roof color is requested, you MUST explicitly state that the A-pillars, B-pillars, and C-pillars remain the PRIMARY BODY COLOR. Only the top roof panel changes color.
          4. MICRO-DETAILS (ANTI-BLUR): For small contrasting items (like gold door handles, colored brake calipers, specific wheel spokes), describe them distinctly and sharply. Use language that prevents their color from bleeding into the surrounding dark body.
          5. Frame the prompt for clear material distinction (glossy paint, matte plastic, chrome).
          6. MANDATORY START: "Masterpiece, award-winning professional automotive photography, 8k resolution, hyper-realistic, Unreal Engine 5 render, ray tracing, specular reflections, 35mm lens, cinematic studio lighting, deep depth of field, vivid and extremely accurate colors."
          7. Output ONLY the final detailed paragraph prompt.`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final HD]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Semente livre e processamento no máximo)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 40, // Aumentado para 40: Força nitidez máxima em maçanetas e rodas complexas
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        // SEED REMOVIDO: A IA agora tem liberdade para não embaçar a imagem ao desenhar peças novas.
      },
      logs: false
    });

    const url = result?.data?.images?.[0]?.url;

    if (!url) {
      return NextResponse.json({ error: 'Falha ao gerar imagem.' }, { status: 502 });
    }

    return NextResponse.json({ images: [url] });

  } catch (err) {
    console.error('[generate]', err);
    return NextResponse.json({ error: err?.message || 'Erro interno.' }, { status: 500 });
  }
}
