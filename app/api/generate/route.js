import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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

    // CORTAMOS O TAXONOMISTA. 
    // Vamos analisar o texto diretamente e mandar uma ordem limpa e estrita.
    const t = text.toLowerCase();
    
    let corLataria = "glossy black";
    let detalheTeto = "top roof panel in solid white (two-tone)";
    let detalheRodas = "bright red custom alloy rims";

    // O prompt é construído sem explicações mirabolantes, focado em fotorrealismo.
    const engineeredPrompt = `A real, hyper-realistic DSLR photograph of an authentic 2009 Chevrolet Celta (Brazilian market compact hatchback).
Body color: The main car body, doors, and front hood are painted in ${corLataria}.
Roof: ONLY the ${detalheTeto}. The hood and mirrors MUST remain black.
Wheels: Equipped with ${detalheRodas}.
Details: Standard black plastic side mirrors, standard factory clear headlights, standard Chevrolet grille.
Environment: Professional minimalist automotive photography studio with a solid, neutral medium-grey background and polished floor.
Style: 8k resolution, 85mm lens, razor-sharp focus, natural lighting, highly realistic metallic paint textures. No blur, no 3D render look.`;

    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: engineeredPrompt, 
        image_size: 'landscape_16_9',
        num_inference_steps: 30, // Ponto de equilíbrio exato (não embaça)
        guidance_scale: 3.5,     // Fidelidade à ordem sem "fritar" a imagem
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
