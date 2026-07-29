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

    // PASSO 1: O TAXINOMISTA (Identificação limpa e sem viés)
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert global automotive geometric designer. Analyze the user request:
          1. Identify exact make, model, year, and geometry.
          2. Describe precise factory lines, original headlights, grille, and body panels.
          3. Enforce authentic stock shape. Do NOT inject details of other car models.
          Output ONLY the detailed visual geometry blueprint paragraph.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: O ENGENHEIRO DE PROMPT (Com suas regras de Softbox, Reflexo Lateral e Farol Cristalino)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Generate a strict prompt for FLUX Dev.

          CRITICAL RULES (LIGHTING, GLASS CLARITY & ISOLATION):
          1. PERSPECTIVE: Slightly low three-quarter front view.
          2. HEADLIGHTS & GLASS: Headlights MUST feature crystal-clear transparent glass lenses with high-definition internal reflectors and bright bulbs. Absolutely NO foggy, frosted, matte, or dull headlights.
          3. LIGHTING & GLOSS: Professional softbox studio lighting. High-gloss specular highlights concentrated strictly along the SIDE doors, fenders, and side body character lines. Deep, rich clearcoat paint gloss.
          4. ROOF & PILLAR ISOLATION: The top horizontal roof panel maintains a clean uniform finish without glare. Do NOT bleed roof colors onto A/B/C pillars or side doors.
          5. CAMERA & SETTING: Minimalist professional automotive studio with a solid neutral grey backdrop and polished concrete floor. High depth of field, profound depth, and crisp reflections. High resolution, razor-sharp focus. NOT a drawing, 3D render, or matte wrap.
          6. Output ONLY the final prompt starting with: "A real high-end professional automotive photo of..."`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final HD]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Configurações Ouro: 35 passos e 3.8 scale)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 35, // Aumentado para 35 para profundidade e realismo fotográfico
        guidance_scale: 3.8,     // Força a IA a obedecer estritamente ao isolamento de peças e luz lateral
        num_images: 1,
        enable_safety_checker: true,
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
      
