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
      console.error('[AutoVision ERRO]: Chave OPENAI_API_KEY ausente no ambiente.');
      return NextResponse.json(
        { error: 'Chave OPENAI_API_KEY não configurada no servidor.' }, 
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = (body.text || '').trim();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Descrição do veículo vazia.' }, 
        { status: 400 }
      );
    }

    console.log('[AutoVision] Processando solicitação fotorrealista para:', text);

    const response = await openai.images.generate({
      model: "gpt-image-2", // Mantendo o modelo que funcionou para você
      prompt: `Hyper-realistic automotive photography of: ${text}. 
      CAMERA & STYLE: Shot on a DSLR camera, 35mm lens, f/8 aperture for sharp focus, photorealistic, natural lighting mixed with soft studio strobes. NOT a 3D render, NOT an illustration, absolute photorealism.
      ANGLE: Front and side profile (3/4 angle). 
      PAINT & FINISH: Highly polished real car paint, subtle natural reflections on the bodywork, realistic metallic or gloss finish.
      ENVIRONMENT: Clean, neutral, seamless light-gray or soft white studio background to highlight the car.
      EDGES: Sharp, clean photographic edges.`,
      n: 1,
      size: "1024x1024"
    });

    let imageUrl = response?.data?.[0]?.url;
    const base64Data = response?.data?.[0]?.b64_json;

    if (base64Data) {
      imageUrl = `data:image/png;base64,${base64Data}`;
    }

    if (!imageUrl) {
      console.error('[AutoVision ERRO]: A OpenAI respondeu, mas nenhum dado de imagem foi encontrado.');
      return NextResponse.json(
        { error: 'Nenhuma imagem retornada pela OpenAI.' }, 
        { status: 502 }
      );
    }

    console.log('[AutoVision SUCESSO]: Imagem fotorrealista gerada com sucesso.');

    return NextResponse.json(
      { images: [imageUrl] },
      { headers: { 'Cache-Control': 'no-store' } }
    );

  } catch (err) {
    console.error('[AutoVision ERRO CRÍTICO]:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno de comunicação com a OpenAI.' }, 
      { status: 500 }
    );
  }
}
