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

    // PASSO 1: O TAXONOMISTA (Mapeia a anatomia exata e o DNA do carro)
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert South American and global automotive historian and engineer. Analyze the user request. Identify the exact car model, year, generational body shape, platform twins, exact door layout, and grille structure so an image AI won't confuse it with modern cars.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: O ENGENHEIRO DE PROMPT (Solução Nível Infinito + Câmera Dinâmica)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Using the car blueprint and user request, generate a strict, highly detailed English prompt for the FLUX Dev image generator.

          CRITICAL RULES (THE INFINITE ISOLATION PROTOCOL):
          1. Follow the anatomical blueprint strictly for the car's general shape and identity.
          2. UNIVERSAL COMPONENT ISOLATION: Treat the car as an assembly of separate 3D parts (BOTH EXTERIOR AND INTERIOR). Dynamically identify EVERY specific part the user wants colored (roof, mirrors, wheels, seats, dashboard, stitching, etc.).
          3. ANTI-BLEEDING: Use strong isolating language (e.g., "exclusive to", "distinctly contrasting") to prevent primary colors from bleeding into custom accessories or interior materials, and vice-versa.
          4. DYNAMIC CAMERA ANGLE (CRITICAL): 
             - If the user's request focuses primarily on the inside of the car (e.g., seats, dashboard, steering wheel), frame the prompt as a "highly detailed interior cabin view from the driver or passenger perspective".
             - If the request focuses on the outside, frame it as a "clean front three-quarter exterior view".
          5. Frame the prompt so the image generator understands distinct materials (e.g., "glossy paint", "matte plastic", "perforated leather").
          6. MANDATORY START: "Photorealistic 8k resolution, highly detailed, sharp focus, professional automotive photography, studio lighting."
          7. Output ONLY the final detailed paragraph prompt. No bullet points.`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final HD]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Alta fidelidade)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 30, // Aumentado para garantir a nitidez
        guidance_scale: 3.5,
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