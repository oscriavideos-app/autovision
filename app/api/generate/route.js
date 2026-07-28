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

    // PASSO 1: O GEOMETRISTA (O Cérebro que garante o Celta brasileiro legítimo)  
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

    // PASSO 2: O ENGENHEIRO DE PROMPT (Com Verniz Molhado e Trava de Fábrica)
    const promptBuilder = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Master Automotive Prompt Engineer. Generate a strict, hyper-realistic English prompt for the FLUX Dev image generator.

          CRITICAL RULES:
          1. PERSPECTIVE: ALWAYS use a "slightly low three-quarter front view".
          2. PAINT FINISH (CRITICAL): Apply "EXTREME HIGH-GLOSS WET CLEARCOAT" and "MIRROR-LIKE SPECULAR REFLECTIONS" to the main car body paint. It must look incredibly glossy and reflective, NEVER matte, wrapped, or frosted.
          3. FACTORY CONDITION: The car must be "100% ORIGINAL FACTORY STOCK". Strictly NO aftermarket spoilers (aerofólios), wings, roof racks, or modified body kits unless explicitly requested.
          4. ROOF & PILLAR ISOLATION: If a contrasting roof color is requested, ONLY the flat top roof panel changes color. The A, B, and C pillars and side mirrors MUST strictly remain the primary body color. No color bleeding.
          5. Output ONLY the final detailed paragraph prompt starting with: "A real high-end professional automotive photo of..."`
        },
        { role: 'user', content: `Blueprint: ${carAnatomyBlueprint} | Original User Request: ${text}` }
      ],
      temperature: 0.1,
    });


    const engineeredPrompt = promptBuilder.choices[0].message.content.trim();  
    console.log('[Prompt Final HD]:', engineeredPrompt);  

    // PASSO 3: MOTOR FLUX DEV (Configuração ideal para nitidez)  
    fal.config({ credentials: process.env.FAL_KEY });  
    const result = await fal.subscribe('fal-ai/flux/dev', {  
      input: {  
        prompt: engineeredPrompt,  
        image_size: 'landscape_16_9',  
        num_inference_steps: 35, // Mantido equilibrado para garantir nitidez máxima sem esticar
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
