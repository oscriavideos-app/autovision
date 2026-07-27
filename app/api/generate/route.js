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

    // PASSO 1: GEOMETRISTA RIGOROSO ESPECIALIZADO NO CELTA BRASILEIRO
    const taxonomistResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert automotive historian and designer specializing in Latin American cars. 
          The user is asking for a "Chevrolet Celta 2009". 
          CRITICAL ANATOMY OF A BRAZILIAN CHEVROLET CELTA (2009 model):
          - It is a small 2-door or 4-door entry-level hatchback developed on the GM Opel Corsa B platform.
          - It has distinct, simple, rounded-yet-angular headlights, a small front grille with the Chevrolet bowtie badge in the center, clean side door panels without exaggerated modern body creases, and a compact, modest rear hatch.
          - IT IS NOT a modern European hatchback, NOT a sedan, and NOT a sports car. 
          Strictly define this exact box/hatchback shape so the image generator does not hallucinate modern foreign shapes.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
    });

    const carAnatomyBlueprint = taxonomistResponse.choices[0].message.content;

    // PASSO 2: ENGENHEIRO DE PROMPT COM FOCO EM FOTOGRAFIA REAL (SEM CARA DE DESENHO)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Commercial Photographer. Generate a hyper-realistic English prompt for the FLUX Dev image generator based on the blueprint and user request.

          RULES FOR PHOTOREALISM & ISOLATION:
          1. REAL PHOTOGRAPHY STYLE: Must look like a real photograph taken with a physical DSLR camera (e.g., Canon EOS R5, 85mm lens, f/2.8, natural light falloff, authentic metallic paint texture with subtle dust/reflections, no cartoonish or 3D render look).
          2. BODY & HOOD LOCK: The main body, doors, and front hood must share the exact primary color specified by the user (e.g., glossy black).
          3. ROOF ISOLATION: If a contrasting roof color is requested (e.g., white roof), ONLY the flat top roof panel changes color. Mirrors, pillars, and hood remain the primary body color.
          4. WHEEL ISOLATION: If wheel color is specified (e.g., red), apply it ONLY to the alloy wheel rims. Grille, badges, and bumpers must remain standard.
          5. ENVIRONMENT: Professional minimalist automotive studio with a solid neutral medium grey concrete floor and soft, diffused overhead softbox lighting. (No pure white backgrounds that cause blown-out cartoon looks).
          6. Output ONLY the final detailed paragraph prompt starting with: "Real professional photograph of..."`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });

    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();
    console.log('[Prompt Final Fotorrealista]:', engineeredPrompt);

    // PASSO 3: MOTOR FLUX DEV (Ajustado para máxima fidelidade fotográfica)
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 32, 
        guidance_scale: 3.3,     // Mantido equilibrado para evitar o aspecto plástico/embaçado
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
