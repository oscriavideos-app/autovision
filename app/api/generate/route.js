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

    console.log('[AutoVision] Processando solicitação de imagem Premium para:', text);

    // O nome da variável agora é 'response' para bater certinho com o resto do código
    const response = await openai.images.generate({
      model: "gpt-image-2", 
      prompt: `Professional automotive studio photography of: ${text}, front and side profile (3/4 angle). 
      CRITICAL CONTRAST RULE: Analyze the main color of the car. If the car body is dark (like black, dark grey, navy), use a clean, seamless, illuminated light-gray or soft white studio background. If the car body is light (like white, silver, light yellow), use a deep, sophisticated dark-charcoal or matte-black studio background. 
      EDGES & QUALITY: Razor-sharp clean cutout edges around the entire vehicle silhouette, absolute ZERO white halos, ZERO artifacts or fuzzy borders. 
      LIGHTING & MATERIALS: High gloss paint with flawless reflections, studio softbox lighting. 
      RULES: 100% stock factory body shape. NO convertibles. NO tuning bodykits. Perfect straight lines.`,
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

    console.log('[AutoVision SUCESSO]: Imagem gerada e convertida com sucesso.');

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
