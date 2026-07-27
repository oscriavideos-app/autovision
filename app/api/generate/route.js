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

    // PASSO 1: O GEOMETRISTA (O Cérebro que sabe exatamente o que é um Celta)
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert global automotive geometric designer. Analyze the user request. Identify the exact car make, model, year, and regional body shape. If it's a Brazilian Chevrolet Celta, strictly define its small, rounded, basic hatchback shape so the image AI doesn't hallucinate modern features or sports car shapes.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: O ENGENHEIRO DE PROMPT (Com Trava de Capô e Fundo Cinza)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Generate a highly detailed English prompt for the FLUX Dev image generator based on the blueprint and user request.

          CRITICAL RULES (ABSOLUTE ISOLATION PROTOCOL):
          1. HOOD & BODY LOCK: The main car body, doors, AND FRONT HOOD must strictly match the primary requested color. They are the same color.
          2. ROOF ISOLATION: If a white roof (or other color) is requested, specify that ONLY the flat top roof panel is that color. It must NOT bleed into the hood, pillars, or mirrors.
          3. WHEELS: Apply wheel color ONLY to the rims. Do NOT bleed this color onto the bumper, grille, or badges.
          4. CAMERA ANGLE: Default to a low-angle front three-quarter view. If the user mentions rear parts, change to a rear three-quarter view.
          5. ENVIRONMENT: The car MUST be in a minimalist professional photography studio with a SOLID NEUTRAL MEDIUM GREY background and polished concrete floor.
          6. Output ONLY the final detailed paragraph prompt starting with: "Award-winning professional automotive photography, 8k resolution, razor-sharp focus, DSLR, realistic metallic paint..."`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final HD]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Restaurado para a nitidez original)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 30, // Retornado ao padrão ideal do Flux para evitar foto embaçada
        guidance_scale: 3.5,     // Retornado ao padrão fotográfico (evita o aspecto de plástico)
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
