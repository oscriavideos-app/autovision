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

    // PASSO 1: O GEOMETRISTA (O Cérebro da OpenAI que mapeia qualquer carro)
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert global automotive geometric designer. Analyze the user request. Identify the exact car make, model, year, and regional body shape (e.g., Brazilian Chevrolet Celta is a small, rounded, basic hatchback). Strictly define its real-world anatomy so the image AI doesn't hallucinate modern features, silver grille trims, or sports car shapes unless explicitly requested.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: O ENGENHEIRO DE PROMPT (Isolamento Cirúrgico e Nitidez)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Generate a highly detailed English prompt for the FLUX Dev image generator based on the blueprint and user request.

          CRITICAL RULES (ABSOLUTE ISOLATION PROTOCOL):
          1. HOOD & MIRROR PROTECTION (ANTI-BLEED): You MUST explicitly state in your prompt that the front hood, front pillars, and side mirrors match the PRIMARY car color. 
          2. ROOF ISOLATION: If a contrasting roof color is requested (e.g., white roof), explicitly state that ONLY the top flat roof panel is that color, and it MUST NOT bleed into the hood or mirrors.
          3. WHEEL ISOLATION: If wheels are colored (e.g., red), apply it ONLY to the wheel rims. Explicitly state: "The front grille, badges, and body trims remain standard factory colors with NO red bleed."
          4. CAMERA ANGLE: Low-angle front three-quarter view showing the car aggressively. If the user mentions rear parts, change to a rear three-quarter view.
          5. ENVIRONMENT: Minimalist professional photography studio with a SOLID NEUTRAL MEDIUM GREY background and polished concrete floor.
          6. SHARPNESS & CLARITY: End your prompt with: "Shot on 85mm lens, insanely sharp focus, high contrast, authentic DSLR photography, crystal clear details, no blur."
          7. Output ONLY the final detailed paragraph prompt.`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final HD]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Obediência e Nitidez Máxima)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 35, 
        guidance_scale: 4.0, // Aumentado para 4.0: Força o FLUX a não misturar as cores das peças
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
                                                                          
