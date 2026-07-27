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

    // PASSO 1: O TAXINOMISTA (Define rigorosamente que é o Celta brasileiro, base Corsa B)
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert automotive geometric designer. The user wants a Chevrolet Celta (specifically the Brazilian 2009 model). 
          Strictly define its real-world anatomy: a small, compact, rounded-yet-simple entry-level hatchback based on the Opel Corsa B platform. 
          Do NOT allow modern European hatchback shapes, sedans, or sports cars. Keep its authentic national popular car lines, simple headlights, and modest proportions.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: O ENGENHEIRO DE PROMPT (Isolamento de Cores e Foco Real)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Generate a clean, detailed English prompt for the FLUX Dev image generator.

          CRITICAL RULES (ISOLATION & REALISM):
          1. BODY & HOOD LOCK: The main car body, doors, and front hood must match the primary requested color (e.g., black). They must be the exact same color.
          2. ROOF ISOLATION: If a contrasting roof color is requested (e.g., white roof), ONLY the flat top roof panel changes color. Mirrors, pillars, and hood must NEVER match the roof color.
          3. WHEEL ISOLATION: If wheels are colored (e.g., red), apply it ONLY to the alloy wheel rims. Do NOT bleed this color onto the bumper, grille, or body.
          4. ENVIRONMENT: A professional minimalist automotive photography studio with a SOLID NEUTRAL MEDIUM GREY background and polished floor. (No pure white backgrounds that cause cartoon/drawing effects).
          5. PHOTOGRAPHY STYLE: Real DSLR photo, razor-sharp focus, crisp details, natural metallic paint texture, no blur, no illustration look.
          6. Output ONLY the final detailed paragraph prompt starting with: "A professional automotive studio photograph of..."`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final Estável]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Configuração limpa para máxima nitidez)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 30, // Passos ideais para manter a nitidez sem embaçar
        guidance_scale: 3.5,     // Mantido equilibrado para evitar o aspecto plástico/desenho
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
