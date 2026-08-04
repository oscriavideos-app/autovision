import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('[AutoVision ERRO]: Chave OPENAI_API_KEY ausente.');
      return NextResponse.json({ error: 'Chave OPENAI_API_KEY não configurada.' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const text = (body.text || '').trim();
    
    if (!text) {
      return NextResponse.json({ error: 'Descrição do veículo vazia.' }, { status: 400 });
    }

    console.log('[AutoVision] Gerando imagem Cinematográfica Premium para:', text);

    const response = await openai.images.generate({
      model: "gpt-image-2", 
      prompt: `Cinematic automotive studio photography of: ${text}. 
      CRITICAL SETTINGS: Ultra-photorealistic, extreme glossy wet-look paint finish, cinematic reflections. 
      LIGHTING: Unreal Engine 5 render, Octane Render style, extreme ray-tracing reflections, glowing high gloss clear coat, dramatic professional overhead softboxes reflecting perfectly on the paint and glass to create an absolute premium masterpiece.

      CAMERA & FRAMING: Wide angle shot, zoomed out. The entire car MUST be fully visible with generous negative space around it. Do not crop the vehicle. 
      ENVIRONMENT: Clean, neutral dark grey or matte black studio background (NO bright colors, NO red). 
      RULES: 100% stock factory body shape. NO convertibles. NO tuning bodykits. Perfect, straight lines and decals without distortion.`,
      n: 1,
      size: "1024x1024"
    });

    let imageUrl = response?.data?.[0]?.url;
    const base64Data = response?.data?.[0]?.b64_json;

    if (base64Data) {
      imageUrl = `data:image/png;base64,${base64Data}`;
    }

    if (!imageUrl) {
      console.error('[AutoVision ERRO]: Nenhuma imagem retornada.');
      return NextResponse.json({ error: 'Nenhuma imagem retornada.' }, { status: 502 });
    }

    return NextResponse.json(
      { images: [imageUrl] },
      { headers: { 'Cache-Control': 'no-store' } }
    );

  } catch (err) {
    console.error('[AutoVision ERRO]:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Erro de comunicação com OpenAI.' }, 
      { status: 500 }
    );
  }
}


