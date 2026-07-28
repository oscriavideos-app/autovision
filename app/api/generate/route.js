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

    // PASSO 1: O TAXINOMISTA (Agora genérico e preciso para QUALQUER carro)
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert global automotive geometric designer. Analyze the user request:
          1. Identify the exact make, model, year, and factory body dimensions.
          2. Describe the precise factory lines, headlights, grille, and body panels of that specific vehicle.
          3. If it's a hatchback (e.g., Honda Fit, Celta, Palio), enforce its exact authentic stock shape.
          4. Do NOT inject details of other car brands or modern body kits unless explicitly requested.
          Output ONLY the detailed visual geometry blueprint paragraph.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: O ENGENHEIRO DE PROMPT (Isolamento do Teto & Verniz de Alta Fotografia)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Generate a strict prompt for FLUX Dev image generator.

          CRITICAL RULES (COLOR ISOLATION & HIGH-GLOSS PHOTOGRAPHY):
          1. PERSPECTIVE: Slightly low three-quarter front view in a high-end clean automotive photography studio.
          2. NO TWO-TONE BODYWORK: The main car body (doors, fenders, hood, A-pillars, B-pillars, C-pillars, side panels above door handles) MUST be 100% the primary requested body color (e.g. glossy metallic grey).
          3. ROOF ISOLATION: If a contrasting roof color (e.g., white) is requested, ONLY the flat horizontal top roof sheet metal panel is painted white. Do NOT extend white paint to the pillars, doors, or side body panels.
          4. DETAILS ISOLATION: 
             - Handles: Apply requested handle color ONLY to the door handle fixtures.
             - Wheels: Apply requested rim color ONLY to the alloy wheels.
          5. PHOTOREALISM & GLOSS: Professional 35mm automotive DSLR photograph, high-gloss clearcoat paint, deep specular reflections of studio light banks, crisp metallic paint texture. NOT a 3D model, vector, drawing, or matte wrap.
          6. Output ONLY the final prompt starting with: "A real high-end professional automotive photo of..."`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final HD]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Ajustado para máximo detalhe e reflexo real)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 32,
        guidance_scale: 3.8,
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
      
